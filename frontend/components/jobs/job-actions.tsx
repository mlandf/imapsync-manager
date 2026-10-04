"use client";

import { Copy, Pencil, Play, RotateCcw, Square } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDeleteButton } from "@/components/common/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useErrorToast } from "@/hooks/use-error-toast";
import { useI18n } from "@/hooks/use-i18n";
import {
  isActive,
  useCancelJob,
  useDeleteJob,
  useDuplicateJob,
  useStartJob,
} from "@/hooks/use-jobs";
import type { Job } from "@/types/api";

function IconButton({ label, children, ...props }: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function JobActions({ job, redirectOnDelete }: { job: Job; redirectOnDelete?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const showError = useErrorToast();
  const start = useStartJob();
  const cancel = useCancelJob();
  const duplicate = useDuplicateJob();
  const remove = useDeleteJob();
  const active = isActive(job);

  return (
    <div className="flex items-center">
      {active ? (
        <IconButton
          label={t("jobs.stop")}
          disabled={cancel.isPending}
          onClick={() =>
            cancel.mutate(job.id, {
              onSuccess: () => toast.info(t("jobs.cancelled")),
              onError: showError,
            })
          }
        >
          <Square className="size-4 text-destructive" />
        </IconButton>
      ) : (
        <IconButton
          label={job.status === "draft" ? t("jobs.start") : t("jobs.restart")}
          disabled={start.isPending}
          onClick={() =>
            start.mutate(job.id, {
              onSuccess: () => toast.success(t("jobs.started")),
              onError: showError,
            })
          }
        >
          {job.status === "draft" ? <Play className="size-4" /> : <RotateCcw className="size-4" />}
        </IconButton>
      )}
      <IconButton
        label={t("jobs.duplicate")}
        onClick={() =>
          duplicate.mutate(job.id, {
            onSuccess: () => toast.success(t("jobs.duplicated")),
            onError: showError,
          })
        }
      >
        <Copy className="size-4" />
      </IconButton>
      {active ? (
        <IconButton label={t("common.edit")} disabled>
          <Pencil className="size-4" />
        </IconButton>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" asChild aria-label={t("common.edit")}>
              <Link href={`/jobs/${job.id}/edit`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("common.edit")}</TooltipContent>
        </Tooltip>
      )}
      <ConfirmDeleteButton
        name={job.name}
        disabled={active}
        onConfirm={() =>
          remove.mutate(job.id, {
            onSuccess: () => {
              toast.success(t("jobs.deleted"));
              if (redirectOnDelete) router.push("/");
            },
            onError: showError,
          })
        }
      />
    </div>
  );
}
