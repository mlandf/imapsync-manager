"""App-Entrypoint."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI

from src.api import job_actions, jobs, profiles
from src.config import Settings, get_settings
from src.logging_setup import configure_logging
from src.models.db import init_engine
from src.services.crypto import SecretBox
from src.services.job_manager import JobManager

log = structlog.get_logger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(settings.log_level)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        settings.data_dir.mkdir(parents=True, exist_ok=True)
        engine = init_engine(settings.database_url)
        secrets = SecretBox(settings.encryption_key)
        manager = JobManager(settings, engine, secrets)
        app.state.secrets = secrets
        app.state.job_manager = manager
        manager.recover()
        log.info("app_started", max_concurrent_jobs=settings.max_concurrent_jobs)
        yield
        await manager.shutdown()

    app = FastAPI(title="imapsync Manager", version="0.1.0", lifespan=lifespan)
    app.include_router(profiles.router)
    app.include_router(jobs.router)
    app.include_router(job_actions.router)

    @app.get("/api/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/info", tags=["health"])
    def info() -> dict[str, int]:
        return {"max_concurrent_jobs": settings.max_concurrent_jobs}

    return app
