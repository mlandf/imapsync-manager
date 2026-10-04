"use client";

import { FlaskConical } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Job } from "@/types/api";

import { JobActions } from "./job-actions";
import { JobProgress } from "./job-progress";
import { JobRoute } from "./job-route";
import { JobStatusBadge } from "./job-status-badge";

export function JobCard({ job }: { job: Job }) {
  const showProgress = job.status !== "draft";
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/jobs/${job.id}`} className="truncate font-semibold hover:underline">
              {job.name}
            </Link>
            <JobStatusBadge status={job.status} />
            {job.options.dry_run && (
              <Badge variant="outline" className="gap-1">
                <FlaskConical className="size-3" /> --dry
              </Badge>
            )}
          </div>
          <JobRoute job={job} />
        </div>
        <JobActions job={job} />
      </CardHeader>
      {(showProgress || job.error_message) && (
        <CardContent className="space-y-2">
          {showProgress && <JobProgress job={job} />}
          {job.error_message && <p className="text-sm text-destructive">{job.error_message}</p>}
        </CardContent>
      )}
    </Card>
  );
}
