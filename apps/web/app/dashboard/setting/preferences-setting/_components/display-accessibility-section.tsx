"use client";

import { MonitorIcon, UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PreferenceSwitch } from "./preference-switch";

export function DisplayAccessibilitySection({
  elderlyMode,
  onElderlyModeChange,
}: {
  elderlyMode: boolean;
  onElderlyModeChange: (enabled: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl font-bold">
          <MonitorIcon className="size-5 text-primary" />
          显示与无障碍
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className={cn(
            "flex flex-col items-start justify-between gap-4 rounded-xl border-2 p-5 transition-all sm:flex-row sm:items-center",
            elderlyMode ? "border-primary bg-primary/5" : "border-border",
          )}
        >
          <div className="flex flex-1 items-start gap-3">
            <UserIcon
              className={cn(
                "mt-0.5 size-7 shrink-0",
                elderlyMode ? "text-primary" : "text-muted-foreground",
              )}
            />
            <div className="space-y-1">
              <p className="text-sm font-semibold">适老化模式</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                启用后自动切换到适老化模式
              </p>
              {elderlyMode && (
                <Badge className="mt-1 h-4 text-[10px]">
                  已启用 · 保存更改后将进入适老化模式
                </Badge>
              )}
            </div>
          </div>
          <PreferenceSwitch
            checked={elderlyMode}
            onCheckedChange={onElderlyModeChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
