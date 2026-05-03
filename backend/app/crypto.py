from __future__ import annotations

import os

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

KEY_LEN = 32
SALT_LEN = 8
NONCE_LEN = 12
TAG_LEN = 16
KDF_ITERATIONS = 200_000
KDF_INFO = b"stegnokit-v1-aesgcm"


def derive_key(password: bytes, salt: bytes) -> bytes:
    if len(salt) != SALT_LEN:
        raise ValueError(f"salt must be {SALT_LEN} bytes, got {len(salt)}")
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=KEY_LEN,
        salt=salt + KDF_INFO,
        iterations=KDF_ITERATIONS,
    )
    return kdf.derive(password)


def encrypt(plaintext: bytes, password: bytes) -> tuple[bytes, bytes, bytes]:
    salt = os.urandom(SALT_LEN)
    nonce = os.urandom(NONCE_LEN)
    ct = AESGCM(derive_key(password, salt)).encrypt(nonce, plaintext, None)
    return salt, nonce, ct


def decrypt(salt: bytes, nonce: bytes, ciphertext: bytes, password: bytes) -> bytes:
    return AESGCM(derive_key(password, salt)).decrypt(nonce, ciphertext, None)
