"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Play, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useErrorToast } from "@/hooks/use-error-toast";
import { useI18n } from "@/hooks/use-i18n";
import { useSaveJob, useStartJob } from "@/hooks/use-jobs";
import { useProfiles } from "@/hooks/use-profiles";
import { formToJob, jobFormSchema, jobToForm, type JobFormValues } from "@/lib/schemas";
import type { Job } from "@/types/api";

import { EndpointFields } from "./endpoint-fields";
import { TextField } from "./fields";
import { OptionsFields } from "./options-fields";

export function JobForm({ job }: { job?: Job }) {
  const { t } = useI18n();
  const router = useRouter();
  const showError = useErrorToast();
  const { data: profiles = [] } = useProfiles();
  const save = useSaveJob();
  const start = useStartJob();
  const isEdit = job !== undefined;

  const form = useForm<JobFormValues>({
    resolver: zodResolver(
      isEdit
        ? jobFormSchema
        : jobFormSchema.extend({
            source_password: jobFormSchema.shape.source_password.min(1, "validation.required"),
            target_password: jobFormSchema.shape.target_password.min(1, "validation.required"),
          }),
    ),
    defaultValues: jobToForm(job),
  });

  const submit = (andStart: boolean) =>
    form.handleSubmit((values) =>
      save.mutate(
        { id: job?.id, data: formToJob(values) },
        {
          onSuccess: (saved) => {
            toast.success(t("jobs.saved"));
            const savedJob = saved as Job;
            if (!andStart) return router.push("/");
            start.mutate(savedJob.id, {
              onSuccess: () => router.push(`/jobs/${savedJob.id}`),
              onError: showError,
            });
          },
          onError: showError,
        },
      ),
    );

  const busy = save.isPending || start.isPending;

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link href="/">
          <ArrowLeft className="size-4" /> {t("common.back")}
        </Link>
      </Button>
      <PageHeader title={isEdit ? t("jobs.edit") : t("jobs.new")} />
      <Form {...form}>
        <form onSubmit={submit(false)} className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <TextField control={form.control} name="name" label={t("jobs.name")} />
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <EndpointFields side="source" control={form.control} profiles={profiles} isEdit={isEdit} />
            <EndpointFields side="target" control={form.control} profiles={profiles} isEdit={isEdit} />
          </div>
          <OptionsFields control={form.control} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/">{t("common.cancel")}</Link>
            </Button>
            <Button type="submit" variant="secondary" disabled={busy}>
              <Save className="size-4" /> {t("common.save")}
            </Button>
            <Button type="button" disabled={busy} onClick={submit(true)}>
              <Play className="size-4" /> {t("jobs.saveAndStart")}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
