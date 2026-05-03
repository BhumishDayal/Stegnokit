from __future__ import annotations

import io

from PIL import Image

try:
    import pillow_avif  # noqa: F401  (registers AVIF with Pillow)
except ImportError:
    pass


INPUT_FORMATS: set[str] = {"PNG", "JPEG", "JPG", "WEBP", "AVIF", "BMP", "TIFF", "GIF"}

OUTPUT_FORMATS: dict[str, tuple[str, dict]] = {
    "PNG": ("PNG", {"compress_level": 6}),
    "JPEG": ("JPEG", {"quality": 92, "subsampling": 0, "optimize": True}),
    "WEBP": ("WEBP", {"quality": 92, "method": 6}),
    "AVIF": ("AVIF", {"quality": 80}),
    "BMP": ("BMP", {}),
    "TIFF": ("TIFF", {"compression": "tiff_lzw"}),
}


def load(data: bytes) -> Image.Image:
    img = Image.open(io.BytesIO(data))
    img.load()
    if img.format and img.format.upper() not in INPUT_FORMATS:
        raise ValueError(f"unsupported input format: {img.format}")
    if img.mode != "RGB":
        img = img.convert("RGB")
    return img


def save(image: Image.Image, fmt: str = "PNG", quality: int | None = None) -> bytes:
    fmt = fmt.upper().lstrip(".")
    if fmt == "JPG":
        fmt = "JPEG"
    if fmt not in OUTPUT_FORMATS:
        raise ValueError(f"unsupported output format: {fmt}")
    pillow_fmt, defaults = OUTPUT_FORMATS[fmt]
    opts = dict(defaults)
    if quality is not None and "quality" in opts:
        opts["quality"] = max(1, min(100, int(quality)))
    if image.mode != "RGB":
        image = image.convert("RGB")
    buf = io.BytesIO()
    image.save(buf, format=pillow_fmt, **opts)
    return buf.getvalue()
