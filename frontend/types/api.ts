export type Security = "ssl" | "starttls" | "none";

export interface ProfileInput {
  name: string;
  host: string;
  port: number | null;
  security: Security;
  authmech: string | null;
  timeout: number | null;
}

export interface Profile extends ProfileInput {
  id: number;
  created_at: string;
}

export interface FolderMapping {
  source: string;
  target: string;
}

export interface SyncOptions {
  dry_run: boolean;
  just_folders: boolean;
  automap: boolean;
  subscribe_all: boolean;
  folders: string[];
  include: string[];
  exclude: string[];
  folder_mappings: FolderMapping[];
  delete2: boolean;
  delete2_folders: boolean;
  delete1: boolean;
  expunge1: boolean;
  skip_cross_duplicates: boolean;
  max_age_days: number | null;
  min_age_days: number | null;
  max_size_bytes: number | null;
  max_bytes_per_second: number | null;
  extra_args: string;
}

export type JobStatus = "draft" | "queued" | "running" | "completed" | "failed" | "cancelled";

export interface JobInput {
  name: string;
  source_profile_id: number;
  source_user: string;
  source_password: string | null;
  target_profile_id: number;
  target_user: string;
  target_password: string | null;
  options: SyncOptions;
}

export interface Job {
  id: number;
  name: string;
  source_profile_id: number;
  source_user: string;
  target_profile_id: number;
  target_user: string;
  options: SyncOptions;
  status: JobStatus;
  exit_code: number | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  percent: number | null;
  messages_total: number | null;
  messages_done: number;
  messages_skipped: number;
  bytes_total: number | null;
  bytes_done: number;
  folders_total: number | null;
  folder_index: number;
  current_folder: string | null;
  msgs_per_second: number | null;
  eta_seconds: number | null;
  errors_count: number;
}

export interface AppInfo {
  max_concurrent_jobs: number;
}
