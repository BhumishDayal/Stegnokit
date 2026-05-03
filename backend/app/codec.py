"""
Wire format embedded in carriers:

    [ length header : 16 B ]   four uint32 copies of body length, majority-voted on decode
    [ body          :  N B ]   Reed-Solomon-encoded encrypted blob

Body, after RS-decode:

    [ salt : 8 B ] [ nonce : 12 B ] [ AES-256-GCM ciphertext + 16 B tag ]

There is no plaintext magic / version / length field. A wrong password fails
the GCM auth tag, which is indistinguishable from "no payload here" — there
is no fingerprint that says "this is Stegnokit". Salt and nonce are
high-entropy random bytes, statistically interchangeable with carrier noise.
"""
from __future__ import annotations

from collections import Counter

from cryptography.exceptions import InvalidTag

from . import crypto, ecc

HDR_FIXED = crypto.SALT_LEN + crypto.NONCE_LEN  # 20 bytes

LEN_FIELD_BYTES = 4
LEN_HEADER_REPEAT = 4
LEN_HEADER_BYTES = LEN_FIELD_BYTES * LEN_HEADER_REPEAT  # 16


class CodecError(Exception):
    """Raised when a payload cannot be decoded."""


def _frame(plaintext: bytes, password: bytes) -> bytes:
    if not isinstance(plaintext, (bytes, bytearray)):
        raise TypeError("plaintext must be bytes")
    salt, nonce, ct = crypto.encrypt(plaintext, password)
    return salt + nonce + ct


def _unframe(framed: bytes, password: bytes) -> bytes:
    if len(framed) < HDR_FIXED + crypto.TAG_LEN:
        raise CodecError("payload too short")
    salt = framed[: crypto.SALT_LEN]
    nonce = framed[crypto.SALT_LEN : crypto.SALT_LEN + crypto.NONCE_LEN]
    ct = framed[crypto.SALT_LEN + crypto.NONCE_LEN :]
    try:
        return crypto.decrypt(salt, nonce, ct, password)
    except InvalidTag as e:
        raise CodecError("auth tag mismatch — wrong password or no payload here") from e


def _encode_length(n: int) -> bytes:
    if not 0 <= n <= 0xFFFFFFFF:
        raise CodecError("length out of range for 32-bit field")
    return n.to_bytes(LEN_FIELD_BYTES, "big") * LEN_HEADER_REPEAT


def _decode_length(buf: bytes) -> int:
    if len(buf) < LEN_HEADER_BYTES:
        raise CodecError("length header buffer too short")
    candidates = [
        int.from_bytes(buf[i * LEN_FIELD_BYTES : (i + 1) * LEN_FIELD_BYTES], "big")
        for i in range(LEN_HEADER_REPEAT)
    ]
    most_value, most_count = Counter(candidates).most_common(1)[0]
    if most_count >= 2:
        return most_value
    return sorted(candidates)[len(candidates) // 2]


def encode_payload(plaintext: bytes, password: bytes, ecc_nsym: int = ecc.DEFAULT_NSYM) -> bytes:
    framed = _frame(plaintext, password)
    body = ecc.encode(framed, nsym=ecc_nsym)
    return _encode_length(len(body)) + body


def decode_payload(extracted: bytes, password: bytes, ecc_nsym: int = ecc.DEFAULT_NSYM) -> bytes:
    if len(extracted) < LEN_HEADER_BYTES:
        raise CodecError("extracted carrier shorter than length header")
    body_len = _decode_length(extracted[:LEN_HEADER_BYTES])
    if body_len <= 0 or LEN_HEADER_BYTES + body_len > len(extracted):
        raise CodecError(f"implausible body length: {body_len} bytes")
    body = extracted[LEN_HEADER_BYTES : LEN_HEADER_BYTES + body_len]
    try:
        framed = ecc.decode(body, nsym=ecc_nsym)
    except ecc.ReedSolomonError as e:
        raise CodecError(f"ECC decode failed: too many byte errors to recover ({e})") from e
    return _unframe(framed, password)


def total_embed_bytes(plaintext_len: int, ecc_nsym: int = ecc.DEFAULT_NSYM) -> int:
    framed = HDR_FIXED + plaintext_len + crypto.TAG_LEN
    return LEN_HEADER_BYTES + ecc.encoded_length(framed, nsym=ecc_nsym)


def max_plaintext_bytes(carrier_capacity_bytes: int, ecc_nsym: int = ecc.DEFAULT_NSYM) -> int:
    if carrier_capacity_bytes <= 0:
        return 0
    available = carrier_capacity_bytes - LEN_HEADER_BYTES
    chunk_data = ecc.RS_BLOCK - ecc_nsym
    if available <= 0 or chunk_data <= 0:
        return 0
    framed_cap = (available * chunk_data) // (chunk_data + ecc_nsym)
    upper = min(framed_cap - HDR_FIXED - crypto.TAG_LEN, available)
    while upper > 0 and total_embed_bytes(upper, ecc_nsym) > carrier_capacity_bytes:
        upper -= 1
    return max(0, upper)
