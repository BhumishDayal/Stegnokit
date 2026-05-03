import os

from app.bits import bits_to_bytes, bytes_to_bits


def test_roundtrip_random():
    for size in [1, 7, 8, 9, 33, 256, 1024]:
        data = os.urandom(size)
        recovered = bits_to_bytes(bytes_to_bits(data))
        assert recovered == data


def test_known_value():
    assert bytes_to_bits(b"\xa5") == [1, 0, 1, 0, 0, 1, 0, 1]
    assert bits_to_bytes([1, 0, 1, 0, 0, 1, 0, 1]) == b"\xa5"


def test_short_pads_with_zeros():
    assert bits_to_bytes([1]) == b"\x80"
    assert bits_to_bytes([1, 1, 1]) == b"\xe0"
