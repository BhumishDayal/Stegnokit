from __future__ import annotations

from reedsolo import ReedSolomonError, RSCodec

DEFAULT_NSYM = 20
RS_BLOCK = 255


def encode(data: bytes, nsym: int = DEFAULT_NSYM) -> bytes:
    if not 1 <= nsym <= 254:
        raise ValueError("nsym must be in [1, 254]")
    return bytes(RSCodec(nsym).encode(data))


def decode(encoded: bytes, nsym: int = DEFAULT_NSYM) -> bytes:
    decoded, _, _ = RSCodec(nsym).decode(encoded)
    return bytes(decoded)


def encoded_length(data_len: int, nsym: int = DEFAULT_NSYM) -> int:
    if data_len <= 0:
        return 0
    chunk_data = RS_BLOCK - nsym
    num_chunks = (data_len + chunk_data - 1) // chunk_data
    return data_len + nsym * num_chunks


__all__ = ["encode", "decode", "encoded_length", "ReedSolomonError", "DEFAULT_NSYM", "RS_BLOCK"]
