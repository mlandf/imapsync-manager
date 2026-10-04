"""Sync-Jobs inkl. Fortschritt."""

from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from src.models.options import SyncOptions


class JobStatus(StrEnum):
    DRAFT = "draft"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


ACTIVE_STATUSES = {JobStatus.QUEUED, JobStatus.RUNNING}


class Progress(SQLModel):
    messages_total: int | None = None
    messages_done: int = 0
    messages_skipped: int = 0
    bytes_total: int | None = None
    bytes_done: int = 0
    folders_total: int | None = None
    folder_index: int = 0
    current_folder: str | None = None
    msgs_per_second: float | None = None
    eta_seconds: int | None = None
    errors_count: int = 0


class Job(Progress, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=200)
    source_profile_id: int = Field(foreign_key="profile.id")
    source_user: str
    source_password_enc: str
    target_profile_id: int = Field(foreign_key="profile.id")
    target_user: str
    target_password_enc: str
    options: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    status: JobStatus = JobStatus.DRAFT
    exit_code: int | None = None
    error_message: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    started_at: datetime | None = None
    finished_at: datetime | None = None

    def sync_options(self) -> SyncOptions:
        return SyncOptions.model_validate(self.options or {})

    def reset_progress(self) -> None:
        for name, field in Progress.model_fields.items():
            setattr(self, name, field.get_default(call_default_factory=True))
        self.exit_code = None
        self.error_message = None
        self.started_at = None
        self.finished_at = None


class JobWrite(SQLModel):
    name: str = Field(min_length=1, max_length=200)
    source_profile_id: int
    source_user: str = Field(min_length=1)
    source_password: str | None = Field(default=None, description="Leer = unverändert")
    target_profile_id: int
    target_user: str = Field(min_length=1)
    target_password: str | None = None
    options: SyncOptions = Field(default_factory=SyncOptions)


class JobRead(Progress):
    id: int
    name: str
    source_profile_id: int
    source_user: str
    target_profile_id: int
    target_user: str
    options: SyncOptions
    status: JobStatus
    exit_code: int | None
    error_message: str | None
    created_at: datetime
    started_at: datetime | None
    finished_at: datetime | None
    percent: float | None = None

    @classmethod
    def from_job(cls, job: Job) -> "JobRead":
        data = job.model_dump(exclude={"source_password_enc", "target_password_enc", "options"})
        percent: float | None = None
        if job.status == JobStatus.COMPLETED:
            percent = 100.0
        elif job.messages_total:
            percent = min(100.0, 100.0 * job.messages_done / job.messages_total)
        return cls(**data, options=job.sync_options(), percent=percent)
