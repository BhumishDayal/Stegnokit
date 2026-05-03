"""End-to-end audio watermark tests on synthetic audio.

These don't require ffmpeg or any heavy ML deps — just numpy + scipy.
"""
import numpy as np
import pytest

from app import bits as bitops
from app import codec
from app.audio import watermark


SR = 44100


def _synthetic_speech_like(seconds: float, sr: int = SR) -> np.ndarray:
    """Pink-noise-ish signal that approximates speech spectrum, for SNR realism."""
    n = int(seconds * sr)
    rng = np.random.default_rng(42)
    # White noise → -3 dB/oct shaping via cumulative sum.
    white = rng.standard_normal(n).astype(np.float32) * 0.2
    pink = np.cumsum(white) * 0.001
    pink = pink - pink.mean()
    pink = pink / (np.max(np.abs(pink)) + 1e-9) * 0.4
    return pink.astype(np.float32)


def test_chip_is_deterministic():
    a = watermark._make_chip(b"key1", 1024, SR, (1500.0, 4500.0))
    b = watermark._make_chip(b"key1", 1024, SR, (1500.0, 4500.0))
    c = watermark._make_chip(b"key2", 1024, SR, (1500.0, 4500.0))
    assert np.array_equal(a, b)
    assert not np.array_equal(a, c)


def test_capacity_calculation():
    assert watermark.capacity_bits(44100 * 10, 1024) == 430
    assert watermark.capacity_bits(0, 1024) == 0
    with pytest.raises(ValueError):
        watermark.capacity_bits(1000, 0)


def test_bit_roundtrip_on_clean_audio():
    audio = _synthetic_speech_like(seconds=4.0)
    bits_in = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1] * 4  # 64 bits
    out = watermark.embed_bits(audio, SR, bits_in, key=b"k", chip_samples=2048, alpha=0.05)
    bits_out, _ = watermark.extract_bits(out, SR, n_bits=len(bits_in), key=b"k", chip_samples=2048)
    assert bits_out == bits_in


def test_bit_roundtrip_with_wrong_key_fails():
    audio = _synthetic_speech_like(seconds=4.0)
    bits_in = [1, 0, 1, 1] * 16
    out = watermark.embed_bits(audio, SR, bits_in, key=b"correct", chip_samples=2048, alpha=0.05)
    bits_out, _ = watermark.extract_bits(out, SR, n_bits=len(bits_in), key=b"wrong", chip_samples=2048)
    # With the wrong key, decoded bits should be effectively random — at least
    # half should differ from the original.
    diffs = sum(1 for a, b in zip(bits_in, bits_out) if a != b)
    assert diffs >= len(bits_in) // 3


def test_full_codec_roundtrip_on_audio():
    """End-to-end: codec.encode_payload → audio embed → audio extract → codec.decode_payload."""
    audio = _synthetic_speech_like(seconds=30.0)
    msg = b"meet me at 9"
    pw = b"sesame"
    payload = codec.encode_payload(msg, pw)
    payload_bits = bitops.bytes_to_bits(payload)

    chip = 1024
    cap = watermark.capacity_bits(len(audio), chip)
    assert cap >= len(payload_bits), f"need {len(payload_bits)} bits, have {cap}"

    out = watermark.embed_bits(audio, SR, payload_bits, key=pw, chip_samples=chip, alpha=0.05)
    bits_out, _ = watermark.extract_bits(out, SR, n_bits=cap, key=pw, chip_samples=chip)
    recovered_bytes = bitops.bits_to_bytes(bits_out)
    assert codec.decode_payload(recovered_bytes, pw) == msg


def test_capacity_overflow_rejected():
    audio = _synthetic_speech_like(seconds=0.05)
    bits = [1] * 1000
    with pytest.raises(ValueError, match="too many bits"):
        watermark.embed_bits(audio, SR, bits, key=b"k", chip_samples=2048, alpha=0.05)
