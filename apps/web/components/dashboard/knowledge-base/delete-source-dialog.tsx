"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2Icon } from "lucide-react";
import {
  deleteKnowledgeSourceAction,
  type KnowledgeSourceWithCount,
} from "@/lib/actions/knowledge";

export function DeleteSourceDialog({
  open,
  onOpenChange,
  source,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: KnowledgeSourceWithCount;
  onSuccess?: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!source) return;
    setIsDeleting(true);
    const res = await deleteKnowledgeSourceAction(source.id);
    setIsDeleting(false);
    if (res.success) {
      onSuccess?.();
      onOpenChange(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除知识库？</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                你正在删除知识库{" "}
                <strong className="text-foreground">「{source?.title}」</strong>
                。
              </p>
              <p>
                此操作将同时删除其包含的{" "}
                <strong className="text-foreground">
                  {source?.chunkCount ?? 0}
                </strong>{" "}
                条向量内容，
                <strong className="text-destructive">删除后无法恢复</strong>。
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
          >
            {isDeleting && <Loader2Icon className="size-4 animate-spin" />}
            {isDeleting ? "删除中…" : "确认删除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
