from pathlib import Path

import pytest

from src.core.command_builder import (
    Endpoint,
    build_command,
    folder_mapping_regex,
    parse_extra_args,
    perl_quote,
)
from src.models.options import FolderMapping, SyncOptions
from src.models.profile import ProfileBase, Security


def _endpoints() -> tuple[Endpoint, Endpoint]:
    src = ProfileBase(name="a", host="imap.a.de", security=Security.SSL)
    dst = ProfileBase(
        name="b", host="10.1.1.1", port=1143, security=Security.NONE, authmech="LOGIN"
    )
    return Endpoint(src, "u1", Path("/p1")), Endpoint(dst, "u2", Path("/p2"))


def _cmd(opts: SyncOptions) -> list[str]:
    src, dst = _endpoints()
    return build_command("imapsync", src, dst, opts, Path("/pid"))


def test_endpoints_and_default_port() -> None:
    cmd = _cmd(SyncOptions())
    assert cmd[0] == "imapsync"
    assert cmd[cmd.index("--port1") + 1] == "993"
    assert cmd[cmd.index("--port2") + 1] == "1143"
    assert "--ssl1" in cmd and "--notls2" in cmd and "--nossl2" in cmd
    assert cmd[cmd.index("--authmech2") + 1] == "LOGIN"
    assert cmd[cmd.index("--passfile1") + 1] == "/p1"
    assert "geheim" not in " ".join(cmd)


def test_options() -> None:
    opts = SyncOptions(
        dry_run=True,
        delete2=True,
        folders=["INBOX"],
        exclude=["^Junk"],
        max_age_days=30,
        folder_mappings=[FolderMapping(source="Sent", target="Gesendete Elemente")],
        extra_args="--usecache --buffersize 8192",
    )
    cmd = _cmd(opts)
    assert "--dry" in cmd and "--delete2" in cmd
    assert cmd[cmd.index("--folder") + 1] == "INBOX"
    assert cmd[cmd.index("--exclude") + 1] == "^Junk"
    assert cmd[cmd.index("--maxage") + 1] == "30"
    assert cmd[-3:] == ["--usecache", "--buffersize", "8192"]
    assert "--delete1" not in cmd


def test_trim_folder_names_after_mappings() -> None:
    opts = SyncOptions(
        trim_folder_names=True,
        folder_mappings=[FolderMapping(source="Sent", target="Gesendet")],
    )
    cmd = _cmd(opts)
    regexes = [cmd[i + 1] for i, arg in enumerate(cmd) if arg == "--regextrans2"]
    assert regexes == [r"s#^Sent$#Gesendet#", r"s/\s+(?=[\/.]|$)//g", r"s/(^|[\/.])\s+/$1/g"]


def test_starttls() -> None:
    src = ProfileBase(name="a", host="h", security=Security.STARTTLS)
    _, dst = _endpoints()
    cmd = build_command("imapsync", Endpoint(src, "u", Path("/p")), dst, SyncOptions(), Path("/x"))
    assert "--tls1" in cmd
    assert cmd[cmd.index("--port1") + 1] == "143"


def test_regex_quoting() -> None:
    assert perl_quote("a.b c") == r"a\.b\ c"
    assert folder_mapping_regex("Sent", "Gesendet#$") == r"s#^Sent$#Gesendet\#\$#"


def test_extra_args_invalid() -> None:
    with pytest.raises(ValueError):
        parse_extra_args('--foo "unclosed')
