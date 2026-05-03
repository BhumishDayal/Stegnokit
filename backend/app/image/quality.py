from __future__ import annotations

import numpy as np
from PIL import Image
from skimage.metrics import structural_similarity as _ssim


def _to_float(img: Image.Image) -> np.ndarray:
    if img.mode != "RGB":
        img = img.convert("RGB")
    return np.asarray(img, dtype=np.float64) / 255.0


def _align(a: Image.Image, b: Image.Image) -> tuple[np.ndarray, np.ndarray]:
    if a.size != b.size:
        b = b.resize(a.size, Image.LANCZOS)
    return _to_float(a), _to_float(b)


def psnr(original: Image.Image, modified: Image.Image) -> float:
    a, b = _align(original, modified)
    mse = float(np.mean((a - b) ** 2))
    if mse == 0:
        return float("inf")
    return float(10.0 * np.log10(1.0 / mse))


def ssim(original: Image.Image, modified: Image.Image) -> float:
    a, b = _align(original, modified)
    return float(_ssim(a, b, channel_axis=2, data_range=1.0))
