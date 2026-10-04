"use client";

import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDeleteButton } from "@/components/common/confirm-delete-button";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useErrorToast } from "@/hooks/use-error-toast";
import { useI18n } from "@/hooks/use-i18n";
import { DEFAULT_PORTS } from "@/lib/constants";
import { useDeleteProfile, useProfiles } from "@/hooks/use-profiles";
import type { Profile } from "@/types/api";

import { ProfileFormDialog } from "./profile-form-dialog";

export function ProfileList() {
  const { t } = useI18n();
  const { data: profiles, isLoading } = useProfiles();
  const remove = useDeleteProfile();
  const showError = useErrorToast();
  const [dialog, setDialog] = useState<{ open: boolean; profile?: Profile }>({ open: false });

  const onDelete = (profile: Profile) =>
    remove.mutate(profile.id, {
      onSuccess: () => toast.success(t("profiles.deleted")),
      onError: showError,
    });

  return (
    <>
      <PageHeader
        title={t("profiles.title")}
        description={t("profiles.description")}
        actions={
          <Button onClick={() => setDialog({ open: true })}>
            <Plus className="size-4" /> {t("profiles.new")}
          </Button>
        }
      />
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : !profiles?.length ? (
            <p className="p-6 text-sm text-muted-foreground">{t("profiles.empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("profiles.name")}</TableHead>
                  <TableHead>{t("profiles.host")}</TableHead>
                  <TableHead>{t("profiles.port")}</TableHead>
                  <TableHead>{t("profiles.security")}</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-sm">{p.host}</TableCell>
                    <TableCell>
                      {p.port ?? (
                        <span className="text-muted-foreground">{DEFAULT_PORTS[p.security]}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t(`profiles.security.${p.security}`)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("common.edit")}
                        onClick={() => setDialog({ open: true, profile: p })}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <ConfirmDeleteButton name={p.name} onConfirm={() => onDelete(p)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <ProfileFormDialog
        open={dialog.open}
        profile={dialog.profile}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
    </>
  );
}
