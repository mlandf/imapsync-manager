"use client";

import { useFormField } from "@/components/ui/form";
import { useI18n } from "@/hooks/use-i18n";
import type { TranslationKey } from "@/lib/i18n/de";
import { de } from "@/lib/i18n/de";

/** Wie shadcn FormMessage, übersetzt aber zod-Fehlerschlüssel. */
export function FieldMessage() {
  const { error, formMessageId } = useFormField();
  const { t } = useI18n();
  if (!error?.message) return null;
  const message = error.message in de ? t(error.message as TranslationKey) : error.message;
  return (
    <p id={formMessageId} className="text-sm font-medium text-destructive">
      {message}
    </p>
  );
}
