"""Datenbank-Engine und Session-Handling (SQLite)."""

from collections.abc import Iterator

from sqlalchemy import Engine
from sqlmodel import Session, SQLModel, create_engine

_engine: Engine | None = None


def init_engine(url: str) -> Engine:
    global _engine
    _engine = create_engine(url, connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(_engine)
    return _engine


def get_engine() -> Engine:
    if _engine is None:
        raise RuntimeError("Datenbank wurde nicht initialisiert")
    return _engine


def get_session() -> Iterator[Session]:
    with Session(get_engine()) as session:
        yield session
