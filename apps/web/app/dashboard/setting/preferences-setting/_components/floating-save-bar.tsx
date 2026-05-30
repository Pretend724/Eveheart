"use client";

import { CheckCircle2Icon, Loader2Icon, SaveIcon, XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FloatingSaveBar({
  visible,
  saveError,
  saveSuccess,
  isSaving,
  onSave,
}: {
  visible: boolean;
  saveError: string | null;
  saveSuccess: boolean;
  isSaving: boolean;
  onSave: () => void;
}) {
  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-in border-t border-border bg-background/80 backdrop-blur-md duration-200 slide-in-from-bottom-2">
      <div className="mx-auto flex max-w-4xl items-center gap-4 px-5 py-3">
        <p className="hidden flex-1 text-sm text-muted-foreground sm:block">
          您有未保存的更改，保存后立即生效。
        </p>
        <div className="ml-auto flex items-center gap-3">
          {saveError && (
            <span className="flex items-center gap-1.5 text-sm text-destructive">
              <XCircleIcon className="size-4" />
              {saveError}
            </span>
          )}
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2Icon className="size-4" />
              保存成功
            </span>
          )}
          <Button onClick={onSave} disabled={isSaving} className="gap-2 px-6">
            {isSaving ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <SaveIcon className="size-4" />
            )}
            {isSaving ? "保存中…" : "保存设置"}
          </Button>
        </div>
      </div>
    </div>
  );
}
