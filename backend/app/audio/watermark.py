"""
Direct-sequence spread-spectrum (DSSS) audio watermark.

Each message bit modulates a wideband pseudo-random chip sequence which is
band-pass filtered to the psychoacoustically-masked 1.5–4.5 kHz band, then
added to the carrier audio at low amplitude. The chip is keyed by the user's
password, so without it an attacker can't even know where the bits live.

Capacity at 44.1 kHz with chip=1024 → ~43 bits/s.
"""
from __future__ import annotations

import hashlib

import numpy as np
from scipy.signal import butter, sosfiltfilt


def _make_chip(key: bytes, length: int, sr: int, band: tuple[float, float]) -> np.ndarray:
    seed = int.from_bytes(hashlib.sha256(key + b"|stegnokit-audio-chip").digest()[:8], "big")
    rng = np.random.default_rng(seed)
    raw = rng.integers(0, 2, size=length, dtype=np.int8) * 2 - 1
    chip = raw.astype(np.float32)
    sos = butter(4, [band[0], band[1]], btype="band", fs=sr, output="sos")
    chip = sosfiltfilt(sos, chip).astype(np.float32)
    rms = float(np.sqrt(np.mean(chip * chip))) or 1.0
    return chip / rms


def _to_mono_float32(audio: np.ndarray) -> np.ndarray:
    a = np.asarray(audio)
    if a.ndim == 2:
        a = a.mean(axis=1)
    return a.astype(np.float32, copy=False)


def capacity_bits(num_samples: int, chip_samples: int) -> int:
    if chip_samples <= 0:
        raise ValueError("chip_samples must be positive")
    return max(0, num_samples // chip_samples)


def embed_bits(
    audio: np.ndarray,
    sr: int,
    bits: list[int],
    key: bytes,
    chip_samples: int = 1024,
    alpha: float = 0.012,
    band: tuple[float, float] = (1500.0, 4500.0),
) -> np.ndarray:
    a = _to_mono_float32(audio).copy()
    cap = capacity_bits(len(a), chip_samples)
    if len(bits) > cap:
        raise ValueError(f"too many bits: {len(bits)} > carrier capacity {cap}")
    chip = _make_chip(key, chip_samples, sr, band)
    for i, bit in enumerate(bits):
        sign = 1.0 if bit else -1.0
        start = i * chip_samples
        a[start : start + chip_samples] = a[start : start + chip_samples] + alpha * sign * chip
    np.tanh(a, out=a)  # soft clip
    return a


def extract_bits(
    audio: np.ndarray,
    sr: int,
    n_bits: int,
    key: bytes,
    chip_samples: int = 1024,
    band: tuple[float, float] = (1500.0, 4500.0),
) -> tuple[list[int], list[float]]:
    a = _to_mono_float32(audio)
    sos = butter(4, [band[0], band[1]], btype="band", fs=sr, output="sos")
    a_band = sosfiltfilt(sos, a).astype(np.float32)
    chip = _make_chip(key, chip_samples, sr, band)
    bits: list[int] = []
    confidences: list[float] = []
    for i in range(n_bits):
        start = i * chip_samples
        block = a_band[start : start + chip_samples]
        if len(block) < chip_samples:
            break
        c = float(np.dot(block, chip) / chip_samples)
        bits.append(1 if c > 0.0 else 0)
        confidences.append(abs(c))
    return bits, confidences
