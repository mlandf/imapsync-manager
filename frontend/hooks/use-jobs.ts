"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { Job, JobInput } from "@/types/api";

const POLL_INTERVAL_MS = 1000;

export const jobKeys = {
  all: ["jobs"] as const,
  detail: (id: number) => ["jobs", id] as const,
  log: (id: number) => ["jobs", id, "log"] as const,
};

export function isActive(job: Pick<Job, "status">): boolean {
  return job.status === "queued" || job.status === "running";
}

export function useJobs() {
  return useQuery({
    queryKey: jobKeys.all,
    queryFn: api.listJobs,
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useJob(id: number) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => api.getJob(id),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useJobLog(id: number, live: boolean) {
  return useQuery({
    queryKey: jobKeys.log(id),
    queryFn: () => api.jobLog(id, 1000),
    refetchInterval: live ? POLL_INTERVAL_MS : false,
  });
}

export function useAppInfo() {
  return useQuery({ queryKey: ["info"], queryFn: api.info, staleTime: Infinity });
}

function useJobMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => client.invalidateQueries({ queryKey: jobKeys.all }),
  });
}

export function useSaveJob() {
  return useJobMutation(({ id, data }: { id?: number; data: JobInput }) =>
    id ? api.updateJob(id, data) : api.createJob(data),
  );
}

export const useStartJob = () => useJobMutation(api.startJob);
export const useCancelJob = () => useJobMutation(api.cancelJob);
export const useDuplicateJob = () => useJobMutation(api.duplicateJob);
export const useDeleteJob = () => useJobMutation(api.deleteJob);
