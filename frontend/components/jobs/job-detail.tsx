"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useI18n } from "@/hooks/use-i18n";
import { isActive, useJob } from "@/hooks/use-jobs";
import { formatDate } from "@/lib/format";

import { JobActions } from "./job-actions";
import { JobLog } from "./job-log";
import { JobProgress } from "./job-progress";
import { JobRoute } from "./job-route";
import { JobStatusBadge } from "./job-status-badge";

export function JobDetail({ jobId }: { jobId: number }) {
  const { t, locale } = useI18n();
  const { data: job, isLoading, error } = useJob(jobId);

  if (isLoading) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  if (error || !job) return <p className="text-sm text-destructive">{error?.message}</p>;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/">
          <ArrowLeft className="size-4" /> {t("common.back")}
        </Link>
      </Button>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{job.name}</h1>
              <JobStatusBadge status={job.status} />
            </div>
            <JobRoute job={job} />
          </div>
          <JobActions job={job} redirectOnDelete />
        </CardHeader>
        <CardContent className="space-y-4">
          <JobProgress job={job} />
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">{t("progress.started")}</dt>
              <dd>{formatDate(job.started_at, locale)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("progress.finished")}</dt>
              <dd>{formatDate(job.finished_at, locale)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("progress.exitCode")}</dt>
              <dd>{job.exit_code ?? "–"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("progress.skipped")}</dt>
              <dd>{job.messages_skipped.toLocaleString(locale)}</dd>
            </div>
          </dl>
          {job.error_message && <p className="text-sm text-destructive">{job.error_message}</p>}
        </CardContent>
      </Card>
      <JobLog jobId={job.id} live={isActive(job)} />
    </div>
  );
}
