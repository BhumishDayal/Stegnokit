from __future__ import annotations

import logging

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import Response

from .. import bits as bitops
from .. import codec
from ..audio import formats as audio_formats
from ..audio import quality, watermark
from ..config import get_settings
from ..ratelimit import limiter

log = logging.getLogger("stegnokit.audio")
router = APIRouter(prefix="/audio", tags=["audio"])

_MIME_BY_FORMAT = {
    "wav": "audio/wav",
    "flac": "audio/flac",
    "mp3": "audio/mpeg",
    "ogg": "audio/ogg",
    "m4a": "audio/mp4",
    "aac": "audio/aac",
    "opus": "audio/opus",
}


@router.get("/capacity")
@limiter.limit("60/minute")
async def capacity(
    request: Request,
    seconds: float = 10.0,
    sample_rate: int = 44100,
    chip_samples: int = 1024,
):
    if seconds <= 0 or sample_rate <= 0:
        raise HTTPException(status_code=400, detail="seconds and sample_rate must be positive")
    samples = int(seconds * sample_rate)
    cap_bits = watermark.capacity_bits(samples, chip_samples)
    cap_bytes = cap_bits // 8
    return {
        "duration_seconds": seconds,
        "sample_rate": sample_rate,
        "chip_samples": chip_samples,
        "capacity_bits": cap_bits,
        "capacity_bytes": cap_bytes,
        "max_plaintext_bytes": codec.max_plaintext_bytes(cap_bytes),
    }


@router.post("/encode")
@limiter.limit("10/minute")
async def encode_audio(
    request: Request,
    audio: UploadFile = File(..., description="Carrier audio (WAV/FLAC/MP3/OGG/M4A)"),
    message: str = Form(..., min_length=1, max_length=4000),
    password: str = Form(..., min_length=1, max_length=256),
    output_format: str = Form("wav"),
    chip_samples: int = Form(1024, ge=256, le=8192),
    alpha: float = Form(0.012, gt=0.0, le=0.1),
):
    settings = get_settings()
    raw = await audio.read()
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="empty audio upload")
    if len(raw) > settings.max_audio_bytes:
        raise HTTPException(status_code=413, detail="audio too large")

    fmt_in = _detect_audio_format(audio.filename, audio.content_type)

    try:
        samples, sr = audio_formats.load(raw, fmt=fmt_in)
    except Exception as e:
        log.info("audio decode failed: %s", e)
        raise HTTPException(status_code=400, detail=f"could not decode audio: {e}")

    duration = len(samples) / sr if sr else 0.0
    if duration > settings.max_audio_seconds:
        raise HTTPException(
            status_code=400,
            detail=f"audio exceeds {settings.max_audio_seconds:.0f}s",
        )

    cap_bits = watermark.capacity_bits(len(samples), chip_samples)
    cap_bytes = cap_bits // 8
    needed_bits = codec.total_embed_bytes(len(message.encode("utf-8"))) * 8
    if needed_bits > cap_bits:
        max_plain = codec.max_plaintext_bytes(cap_bytes)
        raise HTTPException(
            status_code=400,
            detail=f"audio too short: needs {needed_bits} bits, capacity {cap_bits} bits (max {max_plain}B plaintext at chip_samples={chip_samples})",
        )

    try:
        payload_bytes = codec.encode_payload(message.encode("utf-8"), password.encode("utf-8"))
        payload_bits = bitops.bytes_to_bits(payload_bytes)
        watermarked = watermark.embed_bits(
            samples,
            sr,
            payload_bits,
            password.encode("utf-8"),
            chip_samples=chip_samples,
            alpha=alpha,
        )
        snr = quality.snr_db(samples, watermarked)
        out_bytes = audio_formats.save(watermarked, sr, fmt=output_format)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception:
        log.exception("audio encode failed")
        raise HTTPException(status_code=500, detail="encode failed")

    mime = _MIME_BY_FORMAT.get(output_format.lower(), "application/octet-stream")
    return Response(
        content=out_bytes,
        media_type=mime,
        headers={
            "X-Stegnokit-SNR-dB": f"{snr:.2f}",
            "X-Stegnokit-Bits": str(len(payload_bits)),
            "X-Stegnokit-ChipSamples": str(chip_samples),
            "Content-Disposition": f'attachment; filename="stegnokit.{output_format.lower()}"',
        },
    )


@router.post("/decode")
@limiter.limit("20/minute")
async def decode_audio(
    request: Request,
    audio: UploadFile = File(...),
    password: str = Form(..., min_length=1, max_length=256),
    # 0 means "auto": try every chip size and return the first that decodes.
    chip_samples: int = Form(0, ge=0, le=8192),
):
    settings = get_settings()
    raw = await audio.read()
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="empty audio upload")
    if len(raw) > settings.max_audio_bytes:
        raise HTTPException(status_code=413, detail="audio too large")

    fmt_in = _detect_audio_format(audio.filename, audio.content_type)
    try:
        samples, sr = audio_formats.load(raw, fmt=fmt_in)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"could not decode audio: {e}")

    pw = password.encode("utf-8")
    attempts: list[int] = [512, 1024, 2048, 4096] if chip_samples == 0 else [chip_samples]

    last_err: codec.CodecError | None = None
    for chip in attempts:
        cap_bits = watermark.capacity_bits(len(samples), chip)
        if cap_bits < codec.LEN_HEADER_BYTES * 8:
            continue
        try:
            bits, confidences = watermark.extract_bits(
                samples, sr, n_bits=cap_bits, key=pw, chip_samples=chip,
            )
            payload_bytes = bitops.bits_to_bytes(bits)
            plaintext = codec.decode_payload(payload_bytes, pw)
            mean_conf = sum(confidences) / max(1, len(confidences))
            return {
                "message": plaintext.decode("utf-8", errors="replace"),
                "confidence": float(mean_conf),
                "bits_decoded": len(bits),
                "chip_samples": chip,
            }
        except codec.CodecError as e:
            last_err = e
            continue
        except Exception:
            log.exception("audio decode failed at chip=%d", chip)
            raise HTTPException(status_code=500, detail="decode failed")

    detail = "no payload found" if chip_samples == 0 else (str(last_err) if last_err else "decode failed")
    raise HTTPException(status_code=422, detail=detail)


def _detect_audio_format(filename: str | None, content_type: str | None) -> str | None:
    if filename and "." in filename:
        ext = filename.rsplit(".", 1)[-1].lower()
        if ext in audio_formats.SUPPORTED:
            return ext
    if content_type:
        ct = content_type.lower()
        if "wav" in ct: return "wav"
        if "flac" in ct: return "flac"
        if "mpeg" in ct or "mp3" in ct: return "mp3"
        if "ogg" in ct: return "ogg"
        if "mp4" in ct or "m4a" in ct: return "m4a"
        if "aac" in ct: return "aac"
    return None
