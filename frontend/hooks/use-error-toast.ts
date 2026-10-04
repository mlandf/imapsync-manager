"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import { useI18n } from "@/hooks/use-i18n";

export function useErrorToast() {
  const { t } = useI18n();
  return useCallback(
    (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t("common.error"), { description: message });
    },
    [t],
  );
}
