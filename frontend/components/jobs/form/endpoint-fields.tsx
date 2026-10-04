"use client";

import type { Control } from "react-hook-form";

import { FieldMessage } from "@/components/common/field-message";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/hooks/use-i18n";
import { DEFAULT_PORTS } from "@/lib/constants";
import type { JobFormValues } from "@/lib/schemas";
import type { Profile } from "@/types/api";

import { TextField } from "./fields";

interface Props {
  side: "source" | "target";
  control: Control<JobFormValues>;
  profiles: Profile[];
  isEdit: boolean;
}

export function EndpointFields({ side, control, profiles, isEdit }: Props) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t(`jobs.${side}`)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name={`${side}_profile_id`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("jobs.profile")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="–" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name} ({p.host}:{p.port ?? DEFAULT_PORTS[p.security]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldMessage />
            </FormItem>
          )}
        />
        <TextField
          control={control}
          name={`${side}_user`}
          label={t("jobs.user")}
          autoComplete="off"
        />
        <TextField
          control={control}
          name={`${side}_password`}
          label={t("jobs.password")}
          type="password"
          autoComplete="new-password"
          hint={isEdit ? t("jobs.passwordKeep") : undefined}
        />
      </CardContent>
    </Card>
  );
}
