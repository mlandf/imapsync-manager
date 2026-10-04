"""FastAPI-Dependencies für gemeinsam genutzte Dienste."""

from typing import Annotated

from fastapi import Depends, Request
from sqlmodel import Session

from src.models.db import get_session
from src.services.crypto import SecretBox
from src.services.job_manager import JobManager


def get_manager(request: Request) -> JobManager:
    manager: JobManager = request.app.state.job_manager
    return manager


def get_secrets(request: Request) -> SecretBox:
    secrets: SecretBox = request.app.state.secrets
    return secrets


SessionDep = Annotated[Session, Depends(get_session)]
ManagerDep = Annotated[JobManager, Depends(get_manager)]
SecretsDep = Annotated[SecretBox, Depends(get_secrets)]
