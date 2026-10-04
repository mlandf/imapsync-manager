"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/hooks/use-i18n";
import { isActive, useAppInfo, useJobs } from "@/hooks/use-jobs";
import { useProfiles } from "@/hooks/use-profiles";
import type { Job } from "@/types/api";

import { JobCard } from "./job-card";

/** Aktive Jobs zuerst, danach neueste zuerst. */
function sortJobs(jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => Number(isActive(b)) - Number(isActive(a)) || b.id - a.id);
}

export function JobList() {
  const { t } = useI18n();
  const { data: jobs, isLoading, error } = useJobs();
  const { data: profiles } = useProfiles();
  const { data: info } = useAppInfo();
  const noProfiles = profiles !== undefined && profiles.length === 0;

  return (
    <>
      <PageHeader
        title={t("jobs.title")}
        description={info ? t("jobs.description", { max: info.max_concurrent_jobs }) : undefined}
        actions={
          <Button asChild disabled={noProfiles}>
            <Link href="/jobs/new">
              <Plus className="size-4" /> {t("jobs.new")}
            </Link>
          </Button>
        }
      />
      {error && <p className="mb-4 text-sm text-destructive">{error.message}</p>}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : !jobs?.length ? (
        <Card>
          <CardContent className="space-y-2 p-6 text-sm text-muted-foreground">
            <p>{t("jobs.empty")}</p>
            {noProfiles && (
              <Link href="/profiles" className="text-primary underline">
                {t("jobs.noProfiles")}
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortJobs(jobs).map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </>
  );
}
