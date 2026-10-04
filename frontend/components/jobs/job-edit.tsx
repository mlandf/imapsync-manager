"use client";

import { useI18n } from "@/hooks/use-i18n";
import { useJob } from "@/hooks/use-jobs";

import { JobForm } from "./form/job-form";

export function JobEdit({ jobId }: { jobId: number }) {
  const { t } = useI18n();
  // Kein Polling-Reset des Formulars: JobForm übernimmt die Werte nur initial.
  const { data: job, isLoading, error } = useJob(jobId);
  if (isLoading) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  if (error || !job) return <p className="text-sm text-destructive">{error?.message}</p>;
  return <JobForm job={job} />;
}
