"""Steuer-Endpunkte für Sync-Jobs: Start, Abbruch, Duplizieren, Log."""

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from src.api.deps import ManagerDep, SessionDep
from src.api.jobs import ensure_inactive, get_job_or_404
from src.models.job import Job, JobRead, JobStatus

router = APIRouter(prefix="/api/jobs", tags=["job-actions"])


class LogResponse(BaseModel):
    lines: list[str]


@router.post("/{job_id}/start", response_model=JobRead)
async def start_job(job_id: int, session: SessionDep, manager: ManagerDep) -> JobRead:
    get_job_or_404(session, job_id)
    ensure_inactive(manager, job_id)
    manager.enqueue(job_id)
    session.expire_all()
    return JobRead.from_job(get_job_or_404(session, job_id))


@router.post("/{job_id}/cancel", response_model=JobRead)
async def cancel_job(job_id: int, session: SessionDep, manager: ManagerDep) -> JobRead:
    get_job_or_404(session, job_id)
    if not manager.is_active(job_id):
        raise HTTPException(status.HTTP_409_CONFLICT, "Job ist nicht aktiv")
    await manager.cancel(job_id)
    session.expire_all()
    return JobRead.from_job(get_job_or_404(session, job_id))


@router.post("/{job_id}/duplicate", response_model=JobRead, status_code=status.HTTP_201_CREATED)
def duplicate_job(job_id: int, session: SessionDep) -> JobRead:
    original = get_job_or_404(session, job_id)
    copy = Job(
        name=f"{original.name} (Kopie)",
        source_profile_id=original.source_profile_id,
        source_user=original.source_user,
        source_password_enc=original.source_password_enc,
        target_profile_id=original.target_profile_id,
        target_user=original.target_user,
        target_password_enc=original.target_password_enc,
        options=dict(original.options),
        status=JobStatus.DRAFT,
    )
    session.add(copy)
    session.commit()
    session.refresh(copy)
    return JobRead.from_job(copy)


@router.get("/{job_id}/log", response_model=LogResponse)
def job_log(
    job_id: int,
    session: SessionDep,
    manager: ManagerDep,
    lines: int = Query(default=500, ge=1, le=10000),
) -> LogResponse:
    get_job_or_404(session, job_id)
    return LogResponse(lines=manager.files(job_id).tail(lines))
