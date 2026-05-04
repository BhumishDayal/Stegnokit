from __future__ import annotations

import logging

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import Response

from .. import bits as bitops
from .. import codec
from ..config import get_settings
from ..image import formats, quality, tiling
from ..ratelimit import limiter

log = logging.getLogger("stegnokit.image")
router = APIRouter(prefix="/image", tags=["image"])


_MIME_BY_FORMAT = {
    "PNG": "image/png",
    "JPEG": "image/jpeg",
    "WEBP": "image/webp",
    "AVIF": "image/avif",
    "BMP": "image/bmp",
    "TIFF": "image/tiff",
}


@router.get("/capacity")
@limiter.limit("60/minute")
async def capacity(request: Request, grid: str = "capacity"):
    """Return the byte capacity for a given tiling grid."""
    try:
        g = tiling.grid_for(grid)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    cap_bytes = tiling.capacity_bytes(g)
    return {
        "grid": g,
        "grid_name": grid,
        "capacity_bits": tiling.capacity_bits(g),
        "capacity_bytes": cap_bytes,
        "max_plaintext_bytes": codec.max_plaintext_bytes(cap_bytes),
    }


@router.post("/encode")
@limiter.limit("10/minute")
async def encode_image(
    request: Request,
    image: UploadFile = File(..., description="Carrier image (PNG/JPEG/WebP/AVIF/BMP/TIFF)"),
    message: str = Form(..., min_length=1, max_length=4000),
    password: str = Form(..., min_length=1, max_length=256),
    output_format: str = Form("PNG"),
    grid: str = Form("capacity"),
    output_quality: int | None = Form(None, ge=1, le=100),
):
    settings = get_settings()
    raw = await image.read()
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="empty image upload")
    if len(raw) > settings.max_image_bytes:
        raise HTTPException(status_code=413, detail=f"image exceeds {settings.max_image_bytes} bytes")

    try:
        carrier = formats.load(raw)
    except Exception as e:
        log.info("image decode failed: %s", e)
        raise HTTPException(status_code=400, detail="could not decode image")

    if max(carrier.size) > settings.max_image_dim:
        raise HTTPException(
            status_code=400,
            detail=f"image dimension exceeds {settings.max_image_dim}px",
        )

    try:
        g = tiling.grid_for(grid)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    cap_bytes = tiling.capacity_bytes(g)
    needed = codec.total_embed_bytes(len(message.encode("utf-8")))
    if needed > cap_bytes:
        max_plain = codec.max_plaintext_bytes(cap_bytes)
        raise HTTPException(
            status_code=400,
            detail=f"message too long for grid '{grid}': needs {needed}B, capacity {cap_bytes}B (max {max_plain}B plaintext)",
        )

    try:
        payload_bytes = codec.encode_payload(message.encode("utf-8"), password.encode("utf-8"))
        payload_bits = bitops.bytes_to_bits(payload_bytes)
        watermarked = tiling.embed(carrier, payload_bits, g)
        psnr = quality.psnr(carrier, watermarked)
        ssim = quality.ssim(carrier, watermarked)
        out_bytes = formats.save(watermarked, fmt=output_format, quality=output_quality)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        log.exception("image encode failed")
        raise HTTPException(status_code=500, detail="encode failed")

    fmt_key = output_format.upper()
    if fmt_key == "JPG":
        fmt_key = "JPEG"
    mime = _MIME_BY_FORMAT.get(fmt_key, "application/octet-stream")
    return Response(
        content=out_bytes,
        media_type=mime,
        headers={
            "X-Stegnokit-PSNR": f"{psnr:.2f}",
            "X-Stegnokit-SSIM": f"{ssim:.4f}",
            "X-Stegnokit-Grid": str(g),
            "X-Stegnokit-Bytes": str(needed),
            "Content-Disposition": f'attachment; filename="stegnokit.{output_format.lower()}"',
        },
    )


@router.post("/decode")
@limiter.limit("20/minute")
async def decode_image(
    request: Request,
    image: UploadFile = File(...),
    password: str = Form(..., min_length=1, max_length=256),
    grid: str = Form("auto"),
):
    settings = get_settings()
    raw = await image.read()
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="empty image upload")
    if len(raw) > settings.max_image_bytes:
        raise HTTPException(status_code=413, detail="image too large")

    try:
        carrier = formats.load(raw)
    except Exception:
        raise HTTPException(status_code=400, detail="could not decode image")

    pw = password.encode("utf-8")

    # `grid="auto"` → try every grid size and return the first that decodes
    # cleanly. The codec's AES-GCM auth tag is the gatekeeper, so a wrong
    # grid + wrong bytes can't accidentally pass.
    if grid == "auto":
        attempts = list(tiling.GRID_OPTIONS.values())  # [1, 2, 3, 4]
    else:
        try:
            attempts = [tiling.grid_for(grid)]
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    last_err: codec.CodecError | None = None
    for g in attempts:
        try:
            bits, mean_conf = tiling.extract(carrier, g)
            payload_bytes = bitops.bits_to_bytes(bits)
            plaintext = codec.decode_payload(payload_bytes, pw)
            return {
                "message": plaintext.decode("utf-8", errors="replace"),
                "confidence": float(mean_conf),
                "grid": g,
            }
        except codec.CodecError as e:
            last_err = e
            continue
        except Exception:
            log.exception("image decode failed at grid=%d", g)
            raise HTTPException(status_code=500, detail="decode failed")

    detail = "no payload found" if grid == "auto" else (str(last_err) if last_err else "decode failed")
    raise HTTPException(status_code=422, detail=detail)
