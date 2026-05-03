import pytest

from app import ecc


def test_roundtrip_no_errors():
    data = b"the quick brown fox jumps over the lazy dog"
    encoded = ecc.encode(data, nsym=16)
    assert ecc.decode(encoded, nsym=16) == data


def test_corrects_single_byte_error():
    data = b"steganography is the practice of concealing a message"
    encoded = ecc.encode(data, nsym=20)
    corrupted = bytearray(encoded)
    corrupted[5] ^= 0xFF
    corrupted[20] ^= 0x42
    assert ecc.decode(bytes(corrupted), nsym=20) == data


def test_too_many_errors_raises():
    data = b"x" * 10
    encoded = bytearray(ecc.encode(data, nsym=8))
    # Corrupt more bytes than nsym/2 budget allows.
    for i in range(8):
        encoded[i] ^= 0xFF
    with pytest.raises(ecc.ReedSolomonError):
        ecc.decode(bytes(encoded), nsym=8)


def test_encoded_length_matches_actual():
    for n in [1, 50, 235, 236, 470, 1000]:
        data = b"x" * n
        actual = len(ecc.encode(data, nsym=20))
        predicted = ecc.encoded_length(n, nsym=20)
        assert actual == predicted, f"mismatch at n={n}: actual={actual}, predicted={predicted}"


def test_invalid_nsym_rejected():
    with pytest.raises(ValueError):
        ecc.encode(b"x", nsym=0)
    with pytest.raises(ValueError):
        ecc.encode(b"x", nsym=255)
