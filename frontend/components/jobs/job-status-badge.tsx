"use client";

import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types/api";

const STYLES: Record<JobStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  queued: "bg-warning/15 text-warning border-warning/30",
  running: "bg-info/15 text-info border-info/30",
  completed: "bg-success/15 text-success border-success/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const { t } = useI18n();
  return (
    <Badge variant="outline" className={cn("gap-1", STYLES[status])}>
      {status === "running" && <Loader2 className="size-3 animate-spin" />}
      {t(`status.${status}`)}
    </Badge>
  );
}
