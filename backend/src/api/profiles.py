"""CRUD-Endpunkte für IMAP-Server-Profile."""

from fastapi import APIRouter, HTTPException, status
from sqlmodel import or_, select

from src.api.deps import SessionDep
from src.models.job import Job
from src.models.profile import Profile, ProfileCreate, ProfileRead

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


def _get_or_404(session: SessionDep, profile_id: int) -> Profile:
    profile = session.get(Profile, profile_id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profil nicht gefunden")
    return profile


@router.get("", response_model=list[ProfileRead])
def list_profiles(session: SessionDep) -> list[Profile]:
    return list(session.exec(select(Profile).order_by(Profile.name)).all())


@router.post("", response_model=ProfileRead, status_code=status.HTTP_201_CREATED)
def create_profile(data: ProfileCreate, session: SessionDep) -> Profile:
    profile = Profile.model_validate(data)
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile


@router.get("/{profile_id}", response_model=ProfileRead)
def get_profile(profile_id: int, session: SessionDep) -> Profile:
    return _get_or_404(session, profile_id)


@router.put("/{profile_id}", response_model=ProfileRead)
def update_profile(profile_id: int, data: ProfileCreate, session: SessionDep) -> Profile:
    profile = _get_or_404(session, profile_id)
    profile.sqlmodel_update(data.model_dump())
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(profile_id: int, session: SessionDep) -> None:
    profile = _get_or_404(session, profile_id)
    in_use = session.exec(
        select(Job).where(
            or_(Job.source_profile_id == profile_id, Job.target_profile_id == profile_id)
        )
    ).first()
    if in_use is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Profil wird von Sync-Jobs verwendet")
    session.delete(profile)
    session.commit()
