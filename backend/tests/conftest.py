from collections.abc import AsyncIterator
from pathlib import Path

import pytest
from cryptography.fernet import Fernet
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from src.config import Settings
from src.main import create_app

FAKE_BIN = Path(__file__).parent / "fake_imapsync.sh"


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    return Settings(
        encryption_key=Fernet.generate_key().decode(),
        data_dir=tmp_path,
        imapsync_bin=str(FAKE_BIN),
        max_concurrent_jobs=2,
        cancel_grace_seconds=2,
    )


@pytest.fixture
async def app(settings: Settings) -> AsyncIterator[FastAPI]:
    application = create_app(settings)
    async with application.router.lifespan_context(application):
        yield application


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


PROFILE = {"name": "Quelle", "host": "imap.example.com", "port": None, "security": "ssl"}


async def create_profile(client: AsyncClient, **overrides: object) -> int:
    response = await client.post("/api/profiles", json={**PROFILE, **overrides})
    assert response.status_code == 201
    return int(response.json()["id"])


async def create_job(client: AsyncClient, **options: object) -> int:
    src = await create_profile(client, name="A")
    dst = await create_profile(client, name="B", host="10.0.0.5", port=1993)
    payload = {
        "name": "Test",
        "source_profile_id": src,
        "source_user": "a@example.com",
        "source_password": "geheim1",
        "target_profile_id": dst,
        "target_user": "b@example.com",
        "target_password": "geheim2",
        "options": options,
    }
    response = await client.post("/api/jobs", json=payload)
    assert response.status_code == 201, response.text
    return int(response.json()["id"])
