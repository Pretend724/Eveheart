"use client";

import { Trash2Icon } from "lucide-react";
import { startTransition, useActionState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  clearConversationHistoryAction,
  type ClearConversationHistoryActionState,
} from "@/lib/actions/account-setting";

type DataPrivacyActionsProps = {
  exportMarkdown: string;
};

const initialState: ClearConversationHistoryActionState = {
  error: "",
  success: "",
};

export function DataPrivacyActions({
  exportMarkdown,
}: DataPrivacyActionsProps) {
  const [state, clearFormAction, isPending] = useActionState(
    clearConversationHistoryAction,
    initialState,
  );

  const handleDownload = useCallback(() => {
    const markdown =
      exportMarkdown.trim() ||
      "# Eveheart 个人数据导出\n\n暂无可导出的会话数据。";
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `eveheart-个人数据-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [exportMarkdown]);

  return (
    <div className="flex flex-col gap-4 justify-end">
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-2 py-3 h-auto"
        onClick={handleDownload}
      >
        导出我的个人数据（.md）
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2 py-3 h-auto border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2Icon data-icon="inline-start" />
            清空对话历史
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>确认清空对话历史？</AlertDialogTitle>
            <AlertDialogDescription>
              该操作将永久删除你的全部历史会话与消息记录，删除后无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                startTransition(() => {
                  clearFormAction();
                });
              }}
            >
              {isPending ? "清理中..." : "确认清空"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">{state.success}</p>
      ) : null}
    </div>
  );
}
