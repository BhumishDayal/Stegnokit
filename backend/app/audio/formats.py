"""WAV/FLAC use libsndfile via soundfile. Compressed formats route through
pydub, which requires `ffmpeg` on PATH."""
from __future__ import annotations

import io

import numpy as np
import soundfile as sf
from pydub import AudioSegment
from pydub.utils import which

LOSSLESS = {"wav", "flac"}
LOSSY = {"mp3", "ogg", "m4a", "aac", "opus"}
SUPPORTED = LOSSLESS | LOSSY


def has_ffmpeg() -> bool:
    return which("ffmpeg") is not None


def _normalize_format(fmt: str | None) -> str:
    return (fmt or "").lower().lstrip(".") or ""


def load(data: bytes, fmt: str | None = None) -> tuple[np.ndarray, int]:
    fmt = _normalize_format(fmt)
    if fmt in {"wav", "flac", "ogg"} or fmt == "":
        try:
            samples, sr = sf.read(io.BytesIO(data), always_2d=False)
            if samples.ndim == 2:
                samples = samples.mean(axis=1)
            return samples.astype(np.float32, copy=False), int(sr)
        except Exception:
            pass
    if not has_ffmpeg():
        raise RuntimeError(
            f"format '{fmt}' requires ffmpeg on PATH. Install ffmpeg or upload WAV/FLAC."
        )
    seg = AudioSegment.from_file(io.BytesIO(data), format=fmt or None)
    arr = np.array(seg.get_array_of_samples())
    if seg.channels > 1:
        arr = arr.reshape((-1, seg.channels)).mean(axis=1)
    arr = arr.astype(np.float32) / float(1 << (8 * seg.sample_width - 1))
    return arr, int(seg.frame_rate)


def save(samples: np.ndarray, sr: int, fmt: str = "wav", bitrate: str = "192k") -> bytes:
    fmt = _normalize_format(fmt) or "wav"
    if fmt not in SUPPORTED:
        raise ValueError(f"unsupported audio format: {fmt}")

    samples = np.asarray(samples, dtype=np.float32)
    if samples.ndim == 2:
        samples = samples.mean(axis=1).astype(np.float32)
    samples = np.clip(samples, -1.0, 1.0)

    if fmt in LOSSLESS:
        buf = io.BytesIO()
        kwargs: dict = {"format": fmt.upper()}
        if fmt == "wav":
            kwargs["subtype"] = "PCM_16"
        sf.write(buf, samples, sr, **kwargs)
        return buf.getvalue()

    if not has_ffmpeg():
        raise RuntimeError(f"format '{fmt}' requires ffmpeg on PATH for encoding")
    samples_int16 = (samples * 32767.0).astype(np.int16)
    seg = AudioSegment(samples_int16.tobytes(), frame_rate=sr, sample_width=2, channels=1)
    buf = io.BytesIO()
    seg.export(buf, format=fmt, bitrate=bitrate)
    return buf.getvalue()
