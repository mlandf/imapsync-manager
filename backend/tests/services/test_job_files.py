import stat
from pathlib import Path

from src.services.job_files import JobFiles


def test_prepare_tail_cleanup(tmp_path: Path) -> None:
    files = JobFiles(tmp_path, 7)
    p1, p2 = files.prepare("a", "b")
    assert p1.read_text() == "a" and p2.read_text() == "b"
    assert stat.S_IMODE(p1.stat().st_mode) == 0o600
    files.log_path.write_text("1\n2\n3\n")
    assert files.tail(2) == ["2", "3"]
    files.cleanup()
    assert not files.work_dir.exists()
    files.delete_log()
    assert files.tail(5) == []
