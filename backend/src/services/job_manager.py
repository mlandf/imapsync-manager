"""Orchestriert Sync-Jobs: Warteschlange, Parallelitätslimit, Fortschritt, Abbruch."""

import asyncio
import contextlib
import time
from datetime import UTC, datetime
from typing import TextIO

import structlog
from sqlalchemy import Engine
from sqlmodel import Session, col, select

from src.config import Settings
from src.core.command_builder import Endpoint, build_command
from src.core.progress_parser import ProgressParser
from src.models.job import Job, JobStatus, Progress
from src.models.profile import Profile
from src.services.crypto import SecretBox
from src.services.job_files import JobFiles
from src.services.process_runner import ProcessRunner

log = structlog.get_logger(__name__)

_PERSIST_INTERVAL_SECONDS = 1.0


class JobManager:
    def __init__(self, settings: Settings, engine: Engine, secrets: SecretBox) -> None:
        self._settings = settings
        self._engine = engine
        self._secrets = secrets
        self._semaphore = asyncio.Semaphore(settings.max_concurrent_jobs)
        self._tasks: dict[int, asyncio.Task[None]] = {}
        self._runners: dict[int, ProcessRunner] = {}

    def files(self, job_id: int) -> JobFiles:
        return JobFiles(self._settings.data_dir, job_id)

    def is_active(self, job_id: int) -> bool:
        return job_id in self._tasks

    def recover(self) -> None:
        """Nach Neustart: laufende Jobs als abgebrochen markieren, wartende erneut einreihen."""
        with Session(self._engine) as session:
            jobs = session.exec(
                select(Job).where(col(Job.status).in_([JobStatus.RUNNING, JobStatus.QUEUED]))
            ).all()
            requeue = []
            for job in jobs:
                if job.status == JobStatus.RUNNING:
                    job.status = JobStatus.FAILED
                    job.error_message = "Durch Neustart des Dienstes unterbrochen"
                    job.finished_at = datetime.now(UTC)
                else:
                    requeue.append(job.id)
                session.add(job)
            session.commit()
        for job_id in requeue:
            if job_id is not None:
                self._spawn(job_id)

    def enqueue(self, job_id: int) -> None:
        if self.is_active(job_id):
            raise ValueError("Job ist bereits aktiv")
        with Session(self._engine) as session:
            job = session.get(Job, job_id)
            if job is None:
                raise LookupError("Job nicht gefunden")
            job.reset_progress()
            job.status = JobStatus.QUEUED
            session.add(job)
            session.commit()
        self._spawn(job_id)

    def _spawn(self, job_id: int) -> None:
        task = asyncio.create_task(self._run(job_id), name=f"job-{job_id}")
        self._tasks[job_id] = task
        task.add_done_callback(lambda _: self._tasks.pop(job_id, None))

    async def cancel(self, job_id: int) -> None:
        task = self._tasks.get(job_id)
        if task is None:
            raise ValueError("Job ist nicht aktiv")
        runner = self._runners.get(job_id)
        if runner is not None:
            await runner.terminate()
            with contextlib.suppress(asyncio.CancelledError):
                await task
        else:
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task
            self._finish(job_id, JobStatus.CANCELLED, None, None)

    async def shutdown(self) -> None:
        for runner in list(self._runners.values()):
            await runner.terminate()
        for task in list(self._tasks.values()):
            task.cancel()
        await asyncio.gather(*self._tasks.values(), return_exceptions=True)

    async def _run(self, job_id: int) -> None:
        async with self._semaphore:
            files = self.files(job_id)
            runner = ProcessRunner(self._settings.cancel_grace_seconds)
            self._runners[job_id] = runner
            try:
                exit_code = await self._execute(job_id, files, runner)
                status = self._status_for(runner, exit_code)
                self._finish(job_id, status, exit_code, None)
            except asyncio.CancelledError:
                self._finish(job_id, JobStatus.CANCELLED, None, None)
                raise
            except Exception as exc:  # noqa: BLE001 - Fehler wird am Job sichtbar gemacht
                log.exception("job_failed", job_id=job_id)
                self._finish(job_id, JobStatus.FAILED, None, str(exc))
            finally:
                self._runners.pop(job_id, None)
                files.cleanup()

    @staticmethod
    def _status_for(runner: ProcessRunner, exit_code: int) -> JobStatus:
        if runner.cancelled:
            return JobStatus.CANCELLED
        return JobStatus.COMPLETED if exit_code == 0 else JobStatus.FAILED

    async def _execute(self, job_id: int, files: JobFiles, runner: ProcessRunner) -> int:
        command = self._prepare(job_id, files)
        parser = ProgressParser()
        last_persist = 0.0

        with files.log_path.open("a", encoding="utf-8") as logfile:
            self._write_log(logfile, "$ " + " ".join(command) + "\n")

            def on_line(line: str) -> None:
                nonlocal last_persist
                self._write_log(logfile, line)
                now = time.monotonic()
                if parser.feed(line) and now - last_persist > _PERSIST_INTERVAL_SECONDS:
                    last_persist = now
                    self._save_progress(job_id, parser.progress)

            exit_code = await runner.run(command, on_line)
        self._save_progress(job_id, parser.progress)
        return exit_code

    @staticmethod
    def _write_log(logfile: TextIO, line: str) -> None:
        logfile.write(line)
        logfile.flush()

    def _prepare(self, job_id: int, files: JobFiles) -> list[str]:
        with Session(self._engine) as session:
            job = session.get(Job, job_id)
            if job is None:
                raise LookupError("Job nicht gefunden")
            source = session.get(Profile, job.source_profile_id)
            target = session.get(Profile, job.target_profile_id)
            if source is None or target is None:
                raise LookupError("Server-Profil nicht gefunden")
            pass1, pass2 = files.prepare(
                self._secrets.decrypt(job.source_password_enc),
                self._secrets.decrypt(job.target_password_enc),
            )
            command = build_command(
                self._settings.imapsync_bin,
                Endpoint(source, job.source_user, pass1),
                Endpoint(target, job.target_user, pass2),
                job.sync_options(),
                files.pidfile,
            )
            job.status = JobStatus.RUNNING
            job.started_at = datetime.now(UTC)
            session.add(job)
            session.commit()
        log.info("job_started", job_id=job_id)
        return command

    def _save_progress(self, job_id: int, progress: Progress) -> None:
        with Session(self._engine) as session:
            job = session.get(Job, job_id)
            if job is None:
                return
            for name in Progress.model_fields:
                setattr(job, name, getattr(progress, name))
            session.add(job)
            session.commit()

    def _finish(
        self, job_id: int, status: JobStatus, exit_code: int | None, error: str | None
    ) -> None:
        with Session(self._engine) as session:
            job = session.get(Job, job_id)
            if job is None:
                return
            job.status = status
            job.exit_code = exit_code
            job.error_message = error or (
                f"imapsync beendet mit Exit-Code {exit_code}" if status == JobStatus.FAILED
                and exit_code is not None else None
            )
            job.eta_seconds = None
            job.finished_at = datetime.now(UTC)
            session.add(job)
            session.commit()
        log.info("job_finished", job_id=job_id, status=status, exit_code=exit_code)
