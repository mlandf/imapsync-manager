import asyncio

from httpx import AsyncClient

from tests.conftest import create_job


async def _wait_for(client: AsyncClient, job_id: int, statuses: set[str]) -> dict[str, object]:
    for _ in range(100):
        job: dict[str, object] = (await client.get(f"/api/jobs/{job_id}")).json()
        if job["status"] in statuses:
            return job
        await asyncio.sleep(0.05)
    raise AssertionError(f"Status {statuses} nicht erreicht")


async def test_create_hides_passwords(client: AsyncClient) -> None:
    job_id = await create_job(client)
    body = (await client.get(f"/api/jobs/{job_id}")).text
    assert "geheim" not in body
    assert '"status":"draft"' in body


async def test_run_success_with_progress_and_log(client: AsyncClient) -> None:
    job_id = await create_job(client)
    assert (await client.post(f"/api/jobs/{job_id}/start")).status_code == 200
    job = await _wait_for(client, job_id, {"completed", "failed"})
    assert job["status"] == "completed"
    assert job["messages_total"] == 4
    assert job["messages_done"] == 4
    assert job["percent"] == 100.0
    lines = (await client.get(f"/api/jobs/{job_id}/log")).json()["lines"]
    assert lines[0].startswith("$ ")
    assert "geheim" not in "\n".join(lines)


async def test_run_failure(client: AsyncClient) -> None:
    job_id = await create_job(client, extra_args="--fail")
    await client.post(f"/api/jobs/{job_id}/start")
    job = await _wait_for(client, job_id, {"completed", "failed"})
    assert job["status"] == "failed"
    assert job["exit_code"] == 16
    assert job["errors_count"] == 1


async def test_cancel_and_conflicts(client: AsyncClient) -> None:
    job_id = await create_job(client, extra_args="--slow")
    await client.post(f"/api/jobs/{job_id}/start")
    await _wait_for(client, job_id, {"running"})
    assert (await client.post(f"/api/jobs/{job_id}/start")).status_code == 409
    assert (await client.delete(f"/api/jobs/{job_id}")).status_code == 409
    response = await client.post(f"/api/jobs/{job_id}/cancel")
    assert response.json()["status"] == "cancelled"


async def test_concurrency_limit(client: AsyncClient) -> None:
    ids = [await create_job(client, extra_args="--slow") for _ in range(3)]
    for job_id in ids:
        await client.post(f"/api/jobs/{job_id}/start")
    await _wait_for(client, ids[1], {"running"})
    await asyncio.sleep(0.2)
    statuses = [(await client.get(f"/api/jobs/{i}")).json()["status"] for i in ids]
    assert statuses.count("running") == 2
    assert statuses.count("queued") == 1
    for job_id in ids:
        await client.post(f"/api/jobs/{job_id}/cancel")
    assert (await client.get(f"/api/jobs/{ids[2]}")).json()["status"] == "cancelled"


async def test_update_duplicate_delete(client: AsyncClient) -> None:
    job_id = await create_job(client)
    job = (await client.get(f"/api/jobs/{job_id}")).json()
    payload = {
        **{k: job[k] for k in ("source_profile_id", "source_user", "target_profile_id",
                               "target_user")},
        "name": "Umbenannt",
        "options": {**job["options"], "dry_run": True},
    }
    response = await client.put(f"/api/jobs/{job_id}", json=payload)
    assert response.status_code == 200
    assert response.json()["options"]["dry_run"] is True

    dup = (await client.post(f"/api/jobs/{job_id}/duplicate")).json()
    assert dup["name"] == "Umbenannt (Kopie)"
    assert (await client.delete(f"/api/jobs/{job_id}")).status_code == 204
    assert len((await client.get("/api/jobs")).json()) == 1


async def test_invalid_extra_args(client: AsyncClient) -> None:
    job_id = await create_job(client)
    job = (await client.get(f"/api/jobs/{job_id}")).json()
    payload = {**job, "options": {"extra_args": '"offen'}}
    assert (await client.put(f"/api/jobs/{job_id}", json=payload)).status_code == 422
