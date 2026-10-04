"""Baut die imapsync-Kommandozeile aus Profilen und Job-Optionen.

Passwörter werden nie als Argument übergeben, sondern über --passfile1/2,
damit sie nicht in der Prozessliste sichtbar sind.
"""

import re
import shlex
from dataclasses import dataclass
from pathlib import Path

from src.models.options import SyncOptions
from src.models.profile import ProfileBase, Security

_SECONDS_PER_DAY = 86400


@dataclass(frozen=True)
class Endpoint:
    profile: ProfileBase
    user: str
    passfile: Path


def perl_quote(value: str) -> str:
    """Entspricht Perls quotemeta: alle Nicht-Wort-Zeichen escapen."""
    return re.sub(r"(\W)", r"\\\1", value)


def _replacement_quote(value: str) -> str:
    return re.sub(r"([\\#$@])", r"\\\1", value)


def folder_mapping_regex(source: str, target: str) -> str:
    return f"s#^{perl_quote(source)}$#{_replacement_quote(target)}#"


def _endpoint_args(side: int, ep: Endpoint) -> list[str]:
    p = ep.profile
    args = [
        f"--host{side}", p.host,
        f"--port{side}", str(p.effective_port),
        f"--user{side}", ep.user,
        f"--passfile{side}", str(ep.passfile),
    ]
    if p.security == Security.SSL:
        args.append(f"--ssl{side}")
    elif p.security == Security.STARTTLS:
        args.append(f"--tls{side}")
    else:
        args += [f"--nossl{side}", f"--notls{side}"]
    if p.authmech:
        args += [f"--authmech{side}", p.authmech]
    if p.timeout:
        args += [f"--timeout{side}", str(p.timeout)]
    return args


def _flag_args(opts: SyncOptions) -> list[str]:
    flags = {
        "--dry": opts.dry_run,
        "--justfolders": opts.just_folders,
        "--automap": opts.automap,
        "--subscribeall": opts.subscribe_all,
        "--delete2": opts.delete2,
        "--delete2folders": opts.delete2_folders,
        "--delete1": opts.delete1,
        "--expunge1": opts.expunge1,
        "--skipcrossduplicates": opts.skip_cross_duplicates,
    }
    return [flag for flag, enabled in flags.items() if enabled]


def _value_args(opts: SyncOptions) -> list[str]:
    args: list[str] = []
    for folder in opts.folders:
        args += ["--folder", folder]
    for regex in opts.include:
        args += ["--include", regex]
    for regex in opts.exclude:
        args += ["--exclude", regex]
    for mapping in opts.folder_mappings:
        args += ["--regextrans2", folder_mapping_regex(mapping.source, mapping.target)]
    if opts.max_age_days is not None:
        args += ["--maxage", str(opts.max_age_days)]
    if opts.min_age_days is not None:
        args += ["--minage", str(opts.min_age_days)]
    if opts.max_size_bytes is not None:
        args += ["--maxsize", str(opts.max_size_bytes)]
    if opts.max_bytes_per_second is not None:
        args += ["--maxbytespersecond", str(opts.max_bytes_per_second)]
    return args


def parse_extra_args(extra: str) -> list[str]:
    try:
        return shlex.split(extra)
    except ValueError as exc:
        raise ValueError(f"Zusatzoptionen nicht parsebar: {exc}") from exc


def build_command(
    binary: str,
    source: Endpoint,
    target: Endpoint,
    options: SyncOptions,
    pidfile: Path,
) -> list[str]:
    return [
        binary,
        *_endpoint_args(1, source),
        *_endpoint_args(2, target),
        *_flag_args(options),
        *_value_args(options),
        "--nolog",
        "--pidfile", str(pidfile),
        *parse_extra_args(options.extra_args),
    ]
