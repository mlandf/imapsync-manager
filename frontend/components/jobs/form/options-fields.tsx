"use client";

import type { Control } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/hooks/use-i18n";
import type { JobFormValues } from "@/lib/schemas";

import { SwitchField, TextAreaField, TextField } from "./fields";
import { FolderMappingFields } from "./folder-mapping-fields";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

export function OptionsFields({ control }: { control: Control<JobFormValues> }) {
  const { t } = useI18n();
  const perLine = t("options.onePerLine");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("options.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Section title={t("options.general")}>
          <div className="grid gap-4 md:grid-cols-2">
            <SwitchField
              control={control}
              name="dry_run"
              label={t("options.dry_run")}
              hint={t("options.dry_run.hint")}
            />
            <SwitchField control={control} name="just_folders" label={t("options.just_folders")} />
            <SwitchField control={control} name="automap" label={t("options.automap")} />
            <SwitchField control={control} name="subscribe_all" label={t("options.subscribe_all")} />
            <SwitchField
              control={control}
              name="skip_cross_duplicates"
              label={t("options.skip_cross_duplicates")}
            />
          </div>
        </Section>
        <Separator />
        <Section title={t("options.folders")}>
          <div className="grid gap-4 md:grid-cols-3">
            <TextAreaField control={control} name="folders" label={t("options.folders.list")} hint={perLine} />
            <TextAreaField control={control} name="include" label={t("options.include")} hint={perLine} />
            <TextAreaField control={control} name="exclude" label={t("options.exclude")} hint={perLine} />
          </div>
          <FolderMappingFields control={control} />
          <SwitchField
            control={control}
            name="trim_folder_names"
            label={t("options.trim_folder_names")}
            hint={t("options.trim_folder_names.hint")}
          />
        </Section>
        <Separator />
        <Section title={t("options.filters")}>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField control={control} name="max_age_days" label={t("options.max_age_days")} />
            <TextField control={control} name="min_age_days" label={t("options.min_age_days")} />
            <TextField
              control={control}
              name="max_size_bytes"
              label={t("options.max_size_bytes")}
              hint={t("options.max_size.hint")}
            />
            <TextField
              control={control}
              name="max_bytes_per_second"
              label={t("options.max_bytes_per_second")}
            />
          </div>
        </Section>
        <Separator />
        <Section title={t("options.deletion")}>
          <div className="grid gap-4 md:grid-cols-2">
            <SwitchField control={control} name="delete2" label={t("options.delete2")} danger />
            <SwitchField
              control={control}
              name="delete2_folders"
              label={t("options.delete2_folders")}
              danger
            />
            <SwitchField control={control} name="delete1" label={t("options.delete1")} danger />
            <SwitchField control={control} name="expunge1" label={t("options.expunge1")} danger />
          </div>
        </Section>
        <Separator />
        <TextField
          control={control}
          name="extra_args"
          label={t("options.extra_args")}
          hint={t("options.extra_args.hint")}
        />
      </CardContent>
    </Card>
  );
}
