"""Symmetrische Verschlüsselung für gespeicherte Postfach-Passwörter."""

from cryptography.fernet import Fernet, InvalidToken


class SecretBox:
    def __init__(self, key: str) -> None:
        try:
            self._fernet = Fernet(key.encode())
        except ValueError as exc:
            raise ValueError("ENCRYPTION_KEY ist kein gültiger Fernet-Key") from exc

    def encrypt(self, plaintext: str) -> str:
        return self._fernet.encrypt(plaintext.encode()).decode()

    def decrypt(self, token: str) -> str:
        try:
            return self._fernet.decrypt(token.encode()).decode()
        except InvalidToken as exc:
            raise ValueError("Passwort konnte nicht entschlüsselt werden") from exc
