"""CRUD-Endpunkte für Sync-Jobs."""

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from src.api.deps import ManagerDep, SecretsDep, SessionDep
from src.core.command_builder import parse_extra_args
from src.models.job import Job, JobRead, JobWrite
from src.models.profile import Profile

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def get_job_or_404(session: SessionDep, job_id: int) -> Job:
    job = session.get(Job, job_id)
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job nicht gefunden")
    return job


def ensure_inactive(manager: ManagerDep, job_id: int) -> None:
    if manager.is_active(job_id):
        raise HTTPException(status.HTTP_409_CONFLICT, "Job läuft oder wartet gerade")


def _validate(data: JobWrite, session: SessionDep) -> None:
    for profile_id in (data.source_profile_id, data.target_profile_id):
        if session.get(Profile, profile_id) is None:
            raise HTTPException(422, "Profil existiert nicht")
    try:
        parse_extra_args(data.options.extra_args)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


def _apply(job: Job, data: JobWrite, secrets: SecretsDep) -> None:
    job.name = data.name
    job.source_profile_id = data.source_profile_id
    job.source_user = data.source_user
    job.target_profile_id = data.target_profile_id
    job.target_user = data.target_user
    job.options = data.options.model_dump()
    if data.source_password:
        job.source_password_enc = secrets.encrypt(data.source_password)
    if data.target_password:
        job.target_password_enc = secrets.encrypt(data.target_password)


@router.get("", response_model=list[JobRead])
def list_jobs(session: SessionDep) -> list[JobRead]:
    jobs = session.exec(select(Job).order_by(Job.id.desc())).all()  # type: ignore[union-attr]
    return [JobRead.from_job(job) for job in jobs]


@router.post("", response_model=JobRead, status_code=status.HTTP_201_CREATED)
def create_job(data: JobWrite, session: SessionDep, secrets: SecretsDep) -> JobRead:
    _validate(data, session)
    if not data.source_password or not data.target_password:
        raise HTTPException(422, "Passwörter sind erforderlich")
    job = Job(source_password_enc="", target_password_enc="", **data.model_dump(
        include={"name", "source_profile_id", "source_user", "target_profile_id", "target_user"}
    ))
    _apply(job, data, secrets)
    session.add(job)
    session.commit()
    session.refresh(job)
    return JobRead.from_job(job)


@router.get("/{job_id}", response_model=JobRead)
def get_job(job_id: int, session: SessionDep) -> JobRead:
    return JobRead.from_job(get_job_or_404(session, job_id))


@router.put("/{job_id}", response_model=JobRead)
def update_job(
    job_id: int, data: JobWrite, session: SessionDep, secrets: SecretsDep, manager: ManagerDep
) -> JobRead:
    job = get_job_or_404(session, job_id)
    ensure_inactive(manager, job_id)
    _validate(data, session)
    _apply(job, data, secrets)
    session.add(job)
    session.commit()
    session.refresh(job)
    return JobRead.from_job(job)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(job_id: int, session: SessionDep, manager: ManagerDep) -> None:
    job = get_job_or_404(session, job_id)
    ensure_inactive(manager, job_id)
    session.delete(job)
    session.commit()
    manager.files(job_id).delete_log()
