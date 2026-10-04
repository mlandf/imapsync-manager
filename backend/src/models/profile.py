"""IMAP-Server-Profile (ohne Zugangsdaten)."""

from datetime import UTC, datetime
from enum import StrEnum

from pydantic import field_validator
from sqlmodel import Field, SQLModel


class Security(StrEnum):
    SSL = "ssl"
    STARTTLS = "starttls"
    NONE = "none"


DEFAULT_PORTS: dict[Security, int] = {
    Security.SSL: 993,
    Security.STARTTLS: 143,
    Security.NONE: 143,
}


class ProfileBase(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    host: str = Field(min_length=1, max_length=255)
    port: int | None = Field(default=None, ge=1, le=65535)
    security: Security = Security.SSL
    authmech: str | None = Field(default=None, max_length=30)
    timeout: int | None = Field(default=None, ge=1, le=3600)

    @field_validator("host")
    @classmethod
    def _strip_host(cls, value: str) -> str:
        value = value.strip()
        if not value or " " in value:
            raise ValueError("Ungültiger Hostname oder IP")
        return value

    @property
    def effective_port(self) -> int:
        return self.port or DEFAULT_PORTS[self.security]


class Profile(ProfileBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ProfileCreate(ProfileBase):
    pass


class ProfileRead(ProfileBase):
    id: int
    created_at: datetime
