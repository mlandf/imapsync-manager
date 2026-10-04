import pytest
from cryptography.fernet import Fernet

from src.services.crypto import SecretBox


def test_roundtrip() -> None:
    box = SecretBox(Fernet.generate_key().decode())
    token = box.encrypt("pässwort")
    assert token != "pässwort"
    assert box.decrypt(token) == "pässwort"


def test_wrong_key() -> None:
    token = SecretBox(Fernet.generate_key().decode()).encrypt("x")
    with pytest.raises(ValueError):
        SecretBox(Fernet.generate_key().decode()).decrypt(token)


def test_invalid_key() -> None:
    with pytest.raises(ValueError):
        SecretBox("kein-key")
