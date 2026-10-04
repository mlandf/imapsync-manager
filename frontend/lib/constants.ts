import type { Security } from "@/types/api";

export const DEFAULT_PORTS: Record<Security, number> = { ssl: 993, starttls: 143, none: 143 };
