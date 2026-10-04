import type { AppInfo, Job, JobInput, Profile, ProfileInput } from "@/types/api";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function extractDetail(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d: { msg?: string; loc?: unknown[] }) => `${(d.loc ?? []).slice(1).join(".")}: ${d.msg ?? ""}`)
        .join("; ");
    }
  }
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (response.status === 204) return undefined as T;
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(extractDetail(body, response.statusText), response.status);
  }
  return body as T;
}

const json = (method: string, data?: unknown): RequestInit => ({
  method,
  body: data === undefined ? undefined : JSON.stringify(data),
});

export const api = {
  info: () => request<AppInfo>("/info"),

  listProfiles: () => request<Profile[]>("/profiles"),
  createProfile: (data: ProfileInput) => request<Profile>("/profiles", json("POST", data)),
  updateProfile: (id: number, data: ProfileInput) =>
    request<Profile>(`/profiles/${id}`, json("PUT", data)),
  deleteProfile: (id: number) => request<void>(`/profiles/${id}`, json("DELETE")),

  listJobs: () => request<Job[]>("/jobs"),
  getJob: (id: number) => request<Job>(`/jobs/${id}`),
  createJob: (data: JobInput) => request<Job>("/jobs", json("POST", data)),
  updateJob: (id: number, data: JobInput) => request<Job>(`/jobs/${id}`, json("PUT", data)),
  deleteJob: (id: number) => request<void>(`/jobs/${id}`, json("DELETE")),
  startJob: (id: number) => request<Job>(`/jobs/${id}/start`, json("POST")),
  cancelJob: (id: number) => request<Job>(`/jobs/${id}/cancel`, json("POST")),
  duplicateJob: (id: number) => request<Job>(`/jobs/${id}/duplicate`, json("POST")),
  jobLog: (id: number, lines = 500) =>
    request<{ lines: string[] }>(`/jobs/${id}/log?lines=${lines}`),
};
