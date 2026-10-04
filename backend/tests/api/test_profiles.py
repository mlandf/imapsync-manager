from httpx import AsyncClient

from tests.conftest import create_job, create_profile


async def test_profile_crud(client: AsyncClient) -> None:
    pid = await create_profile(client)
    response = await client.get(f"/api/profiles/{pid}")
    assert response.json()["host"] == "imap.example.com"

    update = {"name": "Neu", "host": "192.168.1.10", "port": 10993, "security": "starttls"}
    response = await client.put(f"/api/profiles/{pid}", json=update)
    assert response.status_code == 200
    assert response.json()["port"] == 10993

    assert len((await client.get("/api/profiles")).json()) == 1
    assert (await client.delete(f"/api/profiles/{pid}")).status_code == 204
    assert (await client.get(f"/api/profiles/{pid}")).status_code == 404


async def test_profile_validation(client: AsyncClient) -> None:
    bad = {"name": "x", "host": "bad host", "security": "ssl"}
    assert (await client.post("/api/profiles", json=bad)).status_code == 422
    bad_port = {"name": "x", "host": "h", "port": 70000, "security": "ssl"}
    assert (await client.post("/api/profiles", json=bad_port)).status_code == 422


async def test_profile_in_use_cannot_be_deleted(client: AsyncClient) -> None:
    job_id = await create_job(client)
    job = (await client.get(f"/api/jobs/{job_id}")).json()
    response = await client.delete(f"/api/profiles/{job['source_profile_id']}")
    assert response.status_code == 409
