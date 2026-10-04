"""Anwendungs-Konfiguration ausschließlich über Umgebungsvariablen."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    encryption_key: str = Field(description="Fernet-Key zur Verschlüsselung der Passwörter")
    data_dir: Path = Path("/data")
    max_concurrent_jobs: int = Field(default=5, ge=1, le=50)
    imapsync_bin: str = "imapsync"
    log_level: str = "INFO"
    cancel_grace_seconds: float = 10.0

    @property
    def database_url(self) -> str:
        return f"sqlite:///{self.data_dir / 'imapsync.db'}"

    @property
    def log_dir(self) -> Path:
        return self.data_dir / "logs"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
