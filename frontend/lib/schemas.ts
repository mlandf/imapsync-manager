import { z } from "zod";

import { parseLines } from "@/lib/format";
import type { JobInput, Profile, ProfileInput, SyncOptions, Job } from "@/types/api";

/** Optionale Ganzzahl als String im Formular ("" = null). */
const optionalInt = (min: number, max = Number.MAX_SAFE_INTEGER) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) >= min && Number(v) <= max), {
      message: "validation.number",
    });

const toIntOrNull = (value: string): number | null => (value.trim() === "" ? null : Number(value));

export const profileFormSchema = z.object({
  name: z.string().trim().min(1, "validation.required"),
  host: z
    .string()
    .trim()
    .min(1, "validation.required")
    .regex(/^[^\s]+$/, "validation.host"),
  port: optionalInt(1, 65535),
  security: z.enum(["ssl", "starttls", "none"]),
  authmech: z.string().trim(),
  timeout: optionalInt(1, 3600),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function profileToForm(profile?: Profile): ProfileFormValues {
  return {
    name: profile?.name ?? "",
    host: profile?.host ?? "",
    port: profile?.port?.toString() ?? "",
    security: profile?.security ?? "ssl",
    authmech: profile?.authmech ?? "",
    timeout: profile?.timeout?.toString() ?? "",
  };
}

export function formToProfile(values: ProfileFormValues): ProfileInput {
  return {
    name: values.name,
    host: values.host,
    port: toIntOrNull(values.port),
    security: values.security,
    authmech: values.authmech || null,
    timeout: toIntOrNull(values.timeout),
  };
}

export const jobFormSchema = z.object({
  name: z.string().trim().min(1, "validation.required"),
  source_profile_id: z.string().min(1, "validation.required"),
  source_user: z.string().trim().min(1, "validation.required"),
  source_password: z.string(),
  target_profile_id: z.string().min(1, "validation.required"),
  target_user: z.string().trim().min(1, "validation.required"),
  target_password: z.string(),
  dry_run: z.boolean(),
  just_folders: z.boolean(),
  automap: z.boolean(),
  subscribe_all: z.boolean(),
  skip_cross_duplicates: z.boolean(),
  delete2: z.boolean(),
  delete2_folders: z.boolean(),
  delete1: z.boolean(),
  expunge1: z.boolean(),
  trim_folder_names: z.boolean(),
  folders: z.string(),
  include: z.string(),
  exclude: z.string(),
  folder_mappings: z.array(
    z.object({ source: z.string().trim(), target: z.string().trim() }),
  ),
  max_age_days: optionalInt(0),
  min_age_days: optionalInt(0),
  max_size_bytes: optionalInt(0),
  max_bytes_per_second: optionalInt(0),
  extra_args: z.string(),
});

export type JobFormValues = z.infer<typeof jobFormSchema>;

export function jobToForm(job?: Job): JobFormValues {
  const o: Partial<SyncOptions> = job?.options ?? {};
  return {
    name: job?.name ?? "",
    source_profile_id: job?.source_profile_id.toString() ?? "",
    source_user: job?.source_user ?? "",
    source_password: "",
    target_profile_id: job?.target_profile_id.toString() ?? "",
    target_user: job?.target_user ?? "",
    target_password: "",
    dry_run: o.dry_run ?? false,
    just_folders: o.just_folders ?? false,
    automap: o.automap ?? false,
    subscribe_all: o.subscribe_all ?? false,
    skip_cross_duplicates: o.skip_cross_duplicates ?? false,
    delete2: o.delete2 ?? false,
    delete2_folders: o.delete2_folders ?? false,
    delete1: o.delete1 ?? false,
    expunge1: o.expunge1 ?? false,
    trim_folder_names: o.trim_folder_names ?? false,
    folders: (o.folders ?? []).join("\n"),
    include: (o.include ?? []).join("\n"),
    exclude: (o.exclude ?? []).join("\n"),
    folder_mappings: o.folder_mappings ?? [],
    max_age_days: o.max_age_days?.toString() ?? "",
    min_age_days: o.min_age_days?.toString() ?? "",
    max_size_bytes: o.max_size_bytes?.toString() ?? "",
    max_bytes_per_second: o.max_bytes_per_second?.toString() ?? "",
    extra_args: o.extra_args ?? "",
  };
}

export function formToJob(v: JobFormValues): JobInput {
  return {
    name: v.name,
    source_profile_id: Number(v.source_profile_id),
    source_user: v.source_user,
    source_password: v.source_password || null,
    target_profile_id: Number(v.target_profile_id),
    target_user: v.target_user,
    target_password: v.target_password || null,
    options: {
      dry_run: v.dry_run,
      just_folders: v.just_folders,
      automap: v.automap,
      subscribe_all: v.subscribe_all,
      skip_cross_duplicates: v.skip_cross_duplicates,
      delete2: v.delete2,
      delete2_folders: v.delete2_folders,
      delete1: v.delete1,
      expunge1: v.expunge1,
      trim_folder_names: v.trim_folder_names,
      folders: parseLines(v.folders),
      include: parseLines(v.include),
      exclude: parseLines(v.exclude),
      folder_mappings: v.folder_mappings.filter((m) => m.source && m.target),
      max_age_days: toIntOrNull(v.max_age_days),
      min_age_days: toIntOrNull(v.min_age_days),
      max_size_bytes: toIntOrNull(v.max_size_bytes),
      max_bytes_per_second: toIntOrNull(v.max_bytes_per_second),
      extra_args: v.extra_args.trim(),
    },
  };
}
