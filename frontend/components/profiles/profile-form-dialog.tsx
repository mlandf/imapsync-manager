"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FieldMessage } from "@/components/common/field-message";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useErrorToast } from "@/hooks/use-error-toast";
import { useI18n } from "@/hooks/use-i18n";
import { DEFAULT_PORTS } from "@/lib/constants";
import { useSaveProfile } from "@/hooks/use-profiles";
import {
  formToProfile,
  profileFormSchema,
  profileToForm,
  type ProfileFormValues,
} from "@/lib/schemas";
import type { Profile } from "@/types/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: Profile;
}

export function ProfileFormDialog({ open, onOpenChange, profile }: Props) {
  const { t } = useI18n();
  const save = useSaveProfile();
  const showError = useErrorToast();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: profileToForm(profile),
  });

  useEffect(() => {
    if (open) form.reset(profileToForm(profile));
  }, [open, profile, form]);

  const security = form.watch("security");

  const onSubmit = (values: ProfileFormValues) =>
    save.mutate(
      { id: profile?.id, data: formToProfile(values) },
      {
        onSuccess: () => {
          toast.success(t("profiles.saved"));
          onOpenChange(false);
        },
        onError: showError,
      },
    );

  const textField = (name: keyof ProfileFormValues, label: string, hint?: ReactNode) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          {hint && <FormDescription>{hint}</FormDescription>}
          <FieldMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{profile ? t("profiles.edit") : t("profiles.new")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {textField("name", t("profiles.name"))}
            {textField("host", t("profiles.host"))}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="security"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("profiles.security")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ssl">{t("profiles.security.ssl")}</SelectItem>
                        <SelectItem value="starttls">{t("profiles.security.starttls")}</SelectItem>
                        <SelectItem value="none">{t("profiles.security.none")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {textField(
                "port",
                t("profiles.port"),
                t("profiles.portHint", { port: DEFAULT_PORTS[security] }),
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {textField("authmech", t("profiles.authmech"), t("profiles.authmechHint"))}
              {textField("timeout", t("profiles.timeout"), t("common.optional"))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
