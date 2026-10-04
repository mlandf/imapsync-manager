"""Startet einen externen Prozess und reicht seine Ausgabe zeilenweise weiter."""

import asyncio
import contextlib
import os
import signal
from collections.abc import Callable, Sequence

import structlog

log = structlog.get_logger(__name__)


class ProcessRunner:
    def __init__(self, cancel_grace_seconds: float) -> None:
        self._grace = cancel_grace_seconds
        self._process: asyncio.subprocess.Process | None = None
        self.cancelled = False

    async def run(self, command: Sequence[str], on_line: Callable[[str], None]) -> int:
        if self.cancelled:
            return -1
        self._process = await asyncio.create_subprocess_exec(
            *command,
            stdin=asyncio.subprocess.DEVNULL,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            start_new_session=True,
        )
        assert self._process.stdout is not None
        async for raw in self._process.stdout:
            on_line(raw.decode("utf-8", errors="replace"))
        return await self._process.wait()

    async def terminate(self) -> None:
        self.cancelled = True
        proc = self._process
        if proc is None or proc.returncode is not None:
            return
        self._signal(proc.pid, signal.SIGTERM)
        try:
            await asyncio.wait_for(proc.wait(), timeout=self._grace)
        except TimeoutError:
            log.warning("process_kill", pid=proc.pid)
            self._signal(proc.pid, signal.SIGKILL)

    @staticmethod
    def _signal(pid: int, sig: signal.Signals) -> None:
        """Signal an die gesamte Prozessgruppe, damit auch Kindprozesse enden."""
        with contextlib.suppress(ProcessLookupError, PermissionError):
            os.killpg(pid, sig)
