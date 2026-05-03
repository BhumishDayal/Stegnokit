from __future__ import annotations

import numpy as np


def snr_db(original: np.ndarray, modified: np.ndarray) -> float:
    a = np.asarray(original, dtype=np.float64)
    b = np.asarray(modified, dtype=np.float64)
    if a.ndim == 2:
        a = a.mean(axis=1)
    if b.ndim == 2:
        b = b.mean(axis=1)
    n = min(len(a), len(b))
    a, b = a[:n], b[:n]
    signal_power = float(np.mean(a * a))
    noise_power = float(np.mean((b - a) ** 2))
    if noise_power == 0:
        return float("inf")
    if signal_power == 0:
        return 0.0
    return float(10.0 * np.log10(signal_power / noise_power))
