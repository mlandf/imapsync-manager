"use client";

import { useEffect, useRef, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/hooks/use-i18n";
import { useJobLog } from "@/hooks/use-jobs";

export function JobLog({ jobId, live }: { jobId: number; live: boolean }) {
  const { t } = useI18n();
  const { data, refetch } = useJobLog(jobId, live);
  const [autoscroll, setAutoscroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lines = data?.lines ?? [];

  // Nach Jobende einmal nachladen, damit die letzten Zeilen sicher angezeigt werden.
  useEffect(() => {
    if (!live) void refetch();
  }, [live, refetch]);

  useEffect(() => {
    if (autoscroll) bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [lines.length, autoscroll]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t("progress.log")}</CardTitle>
        <div className="flex items-center gap-2">
          <Switch id="autoscroll" checked={autoscroll} onCheckedChange={setAutoscroll} />
          <Label htmlFor="autoscroll" className="text-sm">
            {t("progress.autoscroll")}
          </Label>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96 overflow-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">
          {lines.length === 0 ? (
            <span className="text-muted-foreground">{t("progress.logEmpty")}</span>
          ) : (
            lines.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap break-all">
                {line}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </CardContent>
    </Card>
  );
}
