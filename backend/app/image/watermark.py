"""Wrapper around the TrustMark CNN watermarker (Adobe, MIT)."""
from __future__ import annotations

import threading

from PIL import Image

TRUSTMARK_BITS = 100
TRUSTMARK_VARIANT = "Q"

_lock = threading.Lock()
_model = None


def _get_model():
    global _model
    with _lock:
        if _model is None:
            from trustmark import TrustMark

            # use_ECC=False: TrustMark's built-in BCH would otherwise "correct"
            # our payload bits toward the nearest valid codeword, which isn't
            # what we want — Reed-Solomon at the codec layer handles all FEC.
            _model = TrustMark(
                verbose=False,
                model_type=TRUSTMARK_VARIANT,
                use_ECC=False,
                secret_len=TRUSTMARK_BITS,
            )
        return _model


def _bits_to_string(bits: list[int]) -> str:
    return "".join("1" if b else "0" for b in bits)


def embed(image: Image.Image, bits: list[int]) -> Image.Image:
    if len(bits) > TRUSTMARK_BITS:
        raise ValueError(f"too many bits for one watermark: {len(bits)} > {TRUSTMARK_BITS}")
    s = _bits_to_string(bits).ljust(TRUSTMARK_BITS, "0")
    img = image.convert("RGB") if image.mode != "RGB" else image
    out = _get_model().encode(img, s, MODE="binary")
    if isinstance(out, tuple):
        out = out[0]
    return out


def extract(image: Image.Image, n_bits: int = TRUSTMARK_BITS) -> tuple[list[int], bool, float]:
    if n_bits > TRUSTMARK_BITS:
        raise ValueError(f"can't request more than {TRUSTMARK_BITS} bits per call")
    img = image.convert("RGB") if image.mode != "RGB" else image
    result = _get_model().decode(img, MODE="binary")
    if isinstance(result, tuple) and len(result) == 3:
        s, present, confidence = result
    elif isinstance(result, tuple) and len(result) == 2:
        s, confidence = result
        present = True
    else:
        s = result
        present = True
        confidence = 1.0
    bits = [1 if c == "1" else 0 for c in str(s)[:n_bits]]
    if len(bits) < n_bits:
        bits.extend([0] * (n_bits - len(bits)))
    # Without TrustMark's internal ECC, confidence comes back as -1 — the
    # codec's GCM auth tag is the real correctness check anyway.
    conf = float(confidence)
    if conf < 0:
        conf = 1.0
    return bits, bool(present), conf
