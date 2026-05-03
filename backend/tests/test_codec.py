import os

import pytest

from app import codec


def test_roundtrip_basic():
    msg = b"hide this in plain sight"
    encoded = codec.encode_payload(msg, b"password")
    decoded = codec.decode_payload(encoded, b"password")
    assert decoded == msg


def test_wrong_password_raises():
    encoded = codec.encode_payload(b"top secret", b"correct")
    with pytest.raises(codec.CodecError):
        codec.decode_payload(encoded, b"wrong")


def test_tampered_body_recovered_within_ecc_budget():
    msg = b"x" * 50
    encoded = bytearray(codec.encode_payload(msg, b"pw"))
    # Flip a few bytes inside the body (after the 16-byte length header).
    encoded[20] ^= 0xFF
    encoded[40] ^= 0x01
    encoded[60] ^= 0x80
    decoded = codec.decode_payload(bytes(encoded), b"pw")
    assert decoded == msg


def test_tampered_beyond_budget_raises():
    msg = b"hello"
    encoded = bytearray(codec.encode_payload(msg, b"pw"))
    # Corrupt aggressively: more bytes than the ECC budget allows.
    for i in range(20, 60):
        encoded[i] ^= 0xFF
    with pytest.raises(codec.CodecError):
        codec.decode_payload(bytes(encoded), b"pw")


def test_corrupted_length_header_one_copy_recovers():
    msg = b"hello"
    encoded = bytearray(codec.encode_payload(msg, b"pw"))
    # Wreck one of the four length-header copies entirely.
    for i in range(4):
        encoded[i] = 0xFF
    decoded = codec.decode_payload(bytes(encoded), b"pw")
    assert decoded == msg


def test_total_embed_bytes_matches_actual():
    for plen in [1, 16, 64, 200, 1024]:
        msg = os.urandom(plen)
        encoded = codec.encode_payload(msg, b"pw")
        assert len(encoded) == codec.total_embed_bytes(plen)


def test_max_plaintext_bytes_consistent():
    for cap in [128, 256, 512, 1024]:
        max_p = codec.max_plaintext_bytes(cap)
        if max_p > 0:
            needed = codec.total_embed_bytes(max_p)
            assert needed <= cap
            # Capacity is tight: max+1 should overflow.
            assert codec.total_embed_bytes(max_p + 1) > cap


def test_unicode_password_and_message():
    msg = "héllo 🌍 صباح الخير".encode("utf-8")
    pw = "пароль 🔑".encode("utf-8")
    encoded = codec.encode_payload(msg, pw)
    decoded = codec.decode_payload(encoded, pw)
    assert decoded == msg
