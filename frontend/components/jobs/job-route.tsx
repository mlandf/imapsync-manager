"use client";

import { ArrowRight } from "lucide-react";

import { useProfiles } from "@/hooks/use-profiles";
import type { Job } from "@/types/api";

/** Zeigt "user@profil → user@profil". */
export function JobRoute({ job }: { job: Job }) {
  const { data: profiles } = useProfiles();
  const name = (id: number) => profiles?.find((p) => p.id === id)?.name ?? `#${id}`;
  return (
    <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
      <span className="truncate">
        {job.source_user} <span className="opacity-70">@ {name(job.source_profile_id)}</span>
      </span>
      <ArrowRight className="size-3 shrink-0" />
      <span className="truncate">
        {job.target_user} <span className="opacity-70">@ {name(job.target_profile_id)}</span>
      </span>
    </div>
  );
}
