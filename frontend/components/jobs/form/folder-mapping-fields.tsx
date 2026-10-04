"use client";

import { Plus, X } from "lucide-react";
import { useFieldArray, type Control } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/hooks/use-i18n";
import type { JobFormValues } from "@/lib/schemas";

export function FolderMappingFields({ control }: { control: Control<JobFormValues> }) {
  const { t } = useI18n();
  const { fields, append, remove } = useFieldArray({ control, name: "folder_mappings" });

  return (
    <div className="space-y-2">
      <Label>{t("options.mappings")}</Label>
      {fields.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2">
          {(["source", "target"] as const).map((key) => (
            <FormField
              key={key}
              control={control}
              name={`folder_mappings.${index}.${key}`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder={t(`options.mappings.${key}`)} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          ))}
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ source: "", target: "" })}
      >
        <Plus className="size-4" /> {t("options.mappings.add")}
      </Button>
    </div>
  );
}
