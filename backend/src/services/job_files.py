"""Verwaltung der Dateien eines Jobs: Log, temporäre Passwortdateien, PID-Datei."""

import shutil
from collections import deque
from pathlib import Path


class JobFiles:
    def __init__(self, data_dir: Path, job_id: int) -> None:
        self.log_path = data_dir / "logs" / f"job_{job_id}.log"
        self.work_dir = data_dir / "run" / f"job_{job_id}"

    @property
    def pidfile(self) -> Path:
        return self.work_dir / "imapsync.pid"

    def prepare(self, password1: str, password2: str) -> tuple[Path, Path]:
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        self.log_path.write_text("", encoding="utf-8")
        self.work_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
        return self._write_secret("pass1", password1), self._write_secret("pass2", password2)

    def _write_secret(self, name: str, value: str) -> Path:
        path = self.work_dir / name
        path.touch(mode=0o600)
        path.write_text(value, encoding="utf-8")
        return path

    def cleanup(self) -> None:
        shutil.rmtree(self.work_dir, ignore_errors=True)

    def delete_log(self) -> None:
        self.log_path.unlink(missing_ok=True)

    def tail(self, lines: int) -> list[str]:
        if not self.log_path.exists():
            return []
        with self.log_path.open(encoding="utf-8", errors="replace") as fh:
            return [line.rstrip("\n") for line in deque(fh, maxlen=lines)]
