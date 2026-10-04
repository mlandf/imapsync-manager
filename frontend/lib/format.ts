const UNITS = ["B", "KiB", "MiB", "GiB", "TiB"];

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return "–";
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${UNITS[unit]}`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return "–";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return "–";
  const normalized = /[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`;
  return new Date(normalized).toLocaleString(locale);
}

export function elapsedSeconds(startIso: string | null, endIso: string | null): number | null {
  if (!startIso) return null;
  const parse = (v: string) => new Date(/[zZ]|[+-]\d\d:\d\d$/.test(v) ? v : `${v}Z`).getTime();
  const end = endIso ? parse(endIso) : Date.now();
  return Math.max(0, (end - parse(startIso)) / 1000);
}

export function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
