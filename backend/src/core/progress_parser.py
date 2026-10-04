"""Wertet die Ausgabe von imapsync zeilenweise aus und leitet den Fortschritt ab."""

import re
from collections.abc import Callable

from src.models.job import Progress

_UNITS = {"B": 1, "KiB": 1024, "MiB": 1024**2, "GiB": 1024**3, "TiB": 1024**4}

_RE_FOLDERS_TOTAL = re.compile(r"^Host1 Nb folders:\s+(\d+)")
_RE_MSGS_TOTAL = re.compile(r"^Host1 Nb messages:\s+(\d+)")
_RE_BYTES_TOTAL = re.compile(r"^Host1 Total size:\s+(\d+)")
_RE_FOLDER = re.compile(r"^Folder\s+(\d+)/(\d+)\s+\[(.*?)\]")
_RE_SPEED = re.compile(r"([\d.]+) msgs/s")
_RE_COPIED = re.compile(r"([\d.]+) (B|KiB|MiB|GiB|TiB) copied")
_RE_ETA = re.compile(r"\s(\d+) s\s+(\d+)/(\d+) msgs left")
_RE_ERR = re.compile(r"^Err \d+/\d+:")
_RE_DETECTED_ERRORS = re.compile(r"^Detected (\d+) errors")
_RE_TRANSFERRED = re.compile(r"^Messages transferred\s*:\s*(\d+)")
_RE_SKIPPED = re.compile(r"^Messages skipped\s*:\s*(\d+)")
_RE_BYTES_TRANSFERRED = re.compile(r"^Total bytes transferred\s*:\s*(\d+)")


class ProgressParser:
    def __init__(self) -> None:
        self.progress = Progress()
        self._handlers: list[tuple[re.Pattern[str], Callable[[re.Match[str]], None]]] = [
            (_RE_FOLDERS_TOTAL, self._on_folders_total),
            (_RE_MSGS_TOTAL, self._on_msgs_total),
            (_RE_BYTES_TOTAL, self._on_bytes_total),
            (_RE_FOLDER, self._on_folder),
            (_RE_DETECTED_ERRORS, self._on_detected_errors),
            (_RE_TRANSFERRED, self._on_transferred),
            (_RE_SKIPPED, self._on_skipped),
            (_RE_BYTES_TRANSFERRED, self._on_bytes_transferred),
        ]

    def feed(self, line: str) -> bool:
        """Verarbeitet eine Zeile. Liefert True, wenn sich der Fortschritt geändert hat."""
        line = line.rstrip("\r\n")
        if "msgs left" in line:
            self._on_copy_line(line)
            return True
        if _RE_ERR.match(line):
            self.progress.errors_count += 1
            return True
        for pattern, handler in self._handlers:
            match = pattern.match(line)
            if match:
                handler(match)
                return True
        return False

    def _on_copy_line(self, line: str) -> None:
        p = self.progress
        if m := _RE_SPEED.search(line):
            p.msgs_per_second = float(m.group(1))
        if m := _RE_COPIED.search(line):
            p.bytes_done = int(float(m.group(1)) * _UNITS[m.group(2)])
        if m := _RE_ETA.search(line):
            left, total = int(m.group(2)), int(m.group(3))
            p.eta_seconds = int(m.group(1))
            p.messages_total = total
            p.messages_done = max(0, total - left)

    def _on_folders_total(self, m: re.Match[str]) -> None:
        self.progress.folders_total = int(m.group(1))

    def _on_msgs_total(self, m: re.Match[str]) -> None:
        self.progress.messages_total = int(m.group(1))

    def _on_bytes_total(self, m: re.Match[str]) -> None:
        self.progress.bytes_total = int(m.group(1))

    def _on_folder(self, m: re.Match[str]) -> None:
        self.progress.folder_index = int(m.group(1))
        self.progress.folders_total = int(m.group(2))
        self.progress.current_folder = m.group(3)

    def _on_detected_errors(self, m: re.Match[str]) -> None:
        self.progress.errors_count = int(m.group(1))

    def _on_transferred(self, m: re.Match[str]) -> None:
        self.progress.messages_done = int(m.group(1)) + self.progress.messages_skipped

    def _on_skipped(self, m: re.Match[str]) -> None:
        skipped = int(m.group(1))
        self.progress.messages_done += skipped - self.progress.messages_skipped
        self.progress.messages_skipped = skipped

    def _on_bytes_transferred(self, m: re.Match[str]) -> None:
        self.progress.bytes_done = int(m.group(1))
