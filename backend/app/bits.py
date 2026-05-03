from __future__ import annotations


def bytes_to_bits(buf: bytes) -> list[int]:
    out: list[int] = []
    for byte in buf:
        for i in range(7, -1, -1):
            out.append((byte >> i) & 1)
    return out


def bits_to_bytes(bits: list[int]) -> bytes:
    n = len(bits)
    if n % 8:
        bits = list(bits) + [0] * (8 - n % 8)
        n = len(bits)
    out = bytearray(n // 8)
    for i, bit in enumerate(bits):
        out[i // 8] |= (bit & 1) << (7 - (i % 8))
    return bytes(out)
