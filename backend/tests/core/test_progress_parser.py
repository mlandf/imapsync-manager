from src.core.progress_parser import ProgressParser


def test_full_run() -> None:
    parser = ProgressParser()
    lines = [
        "Host1 Nb folders:     12 folders",
        "Host1 Nb messages:  1234 messages",
        "Host1 Total size:  5242880 bytes (5.000 MiB)",
        "Folder    3/12 [INBOX.Archiv] -> [INBOX/Archiv]",
        "msg INBOX/7 {1234} copied to INBOX/8  1.50 msgs/s  0.456 MiB/s  2.000 MiB copied"
        "  ETA: Sat Oct  4 12:00:00 2026  120 s  1000/1234 msgs left",
        "Err 1/50: something went wrong",
    ]
    for line in lines:
        assert parser.feed(line)
    p = parser.progress
    assert p.folders_total == 12
    assert p.folder_index == 3
    assert p.current_folder == "INBOX.Archiv"
    assert p.messages_total == 1234
    assert p.messages_done == 234
    assert p.bytes_total == 5242880
    assert p.bytes_done == 2 * 1024 * 1024
    assert p.msgs_per_second == 1.5
    assert p.eta_seconds == 120
    assert p.errors_count == 1


def test_summary_lines() -> None:
    parser = ProgressParser()
    for line in ["Messages transferred :  10", "Messages skipped     :  5",
                 "Total bytes transferred: 999", "Detected 3 errors"]:
        parser.feed(line)
    p = parser.progress
    assert p.messages_done == 15
    assert p.messages_skipped == 5
    assert p.bytes_done == 999
    assert p.errors_count == 3


def test_irrelevant_line() -> None:
    assert not ProgressParser().feed("Here is imapsync 2.290 on host ...")


def test_real_imapsync_format() -> None:
    parser = ProgressParser()
    parser.feed("Folder     1/1 [INBOX]                             -> [INBOX]          ")
    parser.feed(
        "msg INBOX/31 {19023}          copied to INBOX/2          3.34 msgs/s  62.100 KiB/s "
        "18.577 KiB copied ETA: Sunday 04 October 2026-10-04 10:35:05 +0000 UTC  60 s  "
        "199/230 msgs left"
    )
    p = parser.progress
    assert p.current_folder == "INBOX"
    assert p.messages_done == 31
    assert p.messages_total == 230
    assert p.bytes_done == int(18.577 * 1024)
    assert p.eta_seconds == 60
