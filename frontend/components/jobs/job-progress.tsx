"use client";

import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/hooks/use-i18n";
import { elapsedSeconds, formatBytes, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Job } from "@/types/api";

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("truncate text-sm font-medium tabular-nums", className)}>{value}</div>
    </div>
  );
}

export function JobProgress({ job }: { job: Job }) {
  const { t, locale } = useI18n();
  const percent = job.percent ?? 0;
  const indeterminate = job.status === "running" && job.percent == null;
  const num = (n: number) => n.toLocaleString(locale);

  const messages =
    job.messages_total != null
      ? `${num(job.messages_done)} / ${num(job.messages_total)}`
      : num(job.messages_done);
  const folder =
    job.current_folder != null
      ? `${job.folder_index}/${job.folders_total ?? "?"} · ${job.current_folder}`
      : "–";
  const data =
    job.bytes_total != null
      ? `${formatBytes(job.bytes_done)} / ${formatBytes(job.bytes_total)}`
      : formatBytes(job.bytes_done);
  const speed =
    job.msgs_per_second != null
      ? t("progress.msgsPerSec", { value: job.msgs_per_second.toLocaleString(locale) })
      : "–";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Progress
          value={indeterminate ? 100 : percent}
          className={cn("h-3", indeterminate && "animate-pulse")}
        />
        <span className="w-14 text-right text-sm font-semibold tabular-nums">
          {job.percent != null ? `${percent.toFixed(1)}%` : "–"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label={t("progress.messages")} value={messages} />
        <Stat label={t("progress.data")} value={data} />
        <Stat label={t("progress.folder")} value={folder} />
        <Stat label={t("progress.speed")} value={speed} />
        <Stat
          label={job.status === "running" ? t("progress.eta") : t("progress.elapsed")}
          value={formatDuration(
            job.status === "running"
              ? job.eta_seconds
              : elapsedSeconds(job.started_at, job.finished_at),
          )}
        />
        <Stat
          label={t("progress.errors")}
          value={num(job.errors_count)}
          className={cn(job.errors_count > 0 && "text-destructive")}
        />
      </div>
    </div>
  );
}
