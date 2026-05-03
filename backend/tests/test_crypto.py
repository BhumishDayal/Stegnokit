import pytest
from cryptography.exceptions import InvalidTag

from app import crypto


def test_roundtrip_basic():
    salt, nonce, ct = crypto.encrypt(b"hello world", b"correct horse battery staple")
    pt = crypto.decrypt(salt, nonce, ct, b"correct horse battery staple")
    assert pt == b"hello world"


def test_wrong_password_raises():
    salt, nonce, ct = crypto.encrypt(b"secret", b"right password")
    with pytest.raises(InvalidTag):
        crypto.decrypt(salt, nonce, ct, b"wrong password")


def test_tampered_ciphertext_raises():
    salt, nonce, ct = crypto.encrypt(b"secret", b"pw")
    tampered = bytearray(ct)
    tampered[0] ^= 0x01
    with pytest.raises(InvalidTag):
        crypto.decrypt(salt, nonce, bytes(tampered), b"pw")


def test_unique_nonce_per_call():
    _, n1, _ = crypto.encrypt(b"a", b"pw")
    _, n2, _ = crypto.encrypt(b"a", b"pw")
    assert n1 != n2


def test_empty_plaintext():
    salt, nonce, ct = crypto.encrypt(b"", b"pw")
    assert crypto.decrypt(salt, nonce, ct, b"pw") == b""


def test_large_plaintext():
    plaintext = b"x" * 10_000
    salt, nonce, ct = crypto.encrypt(plaintext, b"pw")
    assert crypto.decrypt(salt, nonce, ct, b"pw") == plaintext


def test_derive_key_deterministic():
    salt = b"\x00" * crypto.SALT_LEN
    k1 = crypto.derive_key(b"pw", salt)
    k2 = crypto.derive_key(b"pw", salt)
    assert k1 == k2
    assert len(k1) == crypto.KEY_LEN
