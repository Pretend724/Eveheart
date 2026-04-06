"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { cn } from "@/lib/utils";
import {
  TrashIcon,
  PlusIcon,
  Loader2Icon,
  CheckCircle2Icon,
  XCircleIcon,
  DownloadIcon,
} from "lucide-react";
import {
  deleteChunkAction,
  addChunkToSourceAction,
  type ChunkRow,
} from "@/lib/actions/knowledge";
import type { KnowledgeSource, RiskLevel } from "@eveheart/rag-db";

// ─── Risk Level Labels ────────────────────────────────────────────────────────

const RISK_LABELS: Record<RiskLevel, string> = {
  general: "通用",
  mild: "轻度",
  moderate: "中度",
  crisis: "危机",
};

const RISK_VARIANTS: Record<RiskLevel, string> = {
  general: "bg-muted text-muted-foreground",
  mild: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  moderate:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  crisis: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const DATE_FMT = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// ─── Chunk Item ───────────────────────────────────────────────────────────────

function ChunkItem({
  chunk,
  onDeleteRequest,
}: {
  chunk: ChunkRow;
  onDeleteRequest: (id: string) => void;
}) {
  const preview =
    chunk.content.length > 160
      ? chunk.content.slice(0, 157) + "…"
      : chunk.content;

  return (
    <div className="group flex items-start gap-3 py-3">
      <div className="flex-1 space-y-1 min-w-0">
        <p className="text-sm leading-relaxed text-foreground">{preview}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
              RISK_VARIANTS[chunk.targetRiskLevel],
            )}
          >
            {RISK_LABELS[chunk.targetRiskLevel]}
          </span>
          <span className="text-[11px] text-muted-foreground">
            #{chunk.chunkIndex + 1} ·{" "}
            {DATE_FMT.format(new Date(chunk.createdAt))}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        onClick={() => onDeleteRequest(chunk.id)}
      >
        <TrashIcon className="size-3.5" />
      </Button>
    </div>
  );
}

// ─── Add Chunk Form ───────────────────────────────────────────────────────────

function AddChunkForm({
  sourceId,
  onSuccess,
}: {
  sourceId: string;
  onSuccess: () => void;
}) {
  const [content, setContent] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setResult(null);

    const res = await addChunkToSourceAction(
      sourceId,
      content.trim(),
      riskLevel,
    );
    setIsSubmitting(false);

    if (res.success) {
      setContent("");
      setResult({
        ok: true,
        msg: `已成功添加 ${res.data?.chunkCount ?? 1} 条内容`,
      });
      onSuccess();
      setTimeout(() => setResult(null), 3000);
    } else {
      setResult({ ok: false, msg: res.error ?? "添加失败" });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="new-chunk-content">手动添加知识内容</Label>
        <Textarea
          id="new-chunk-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="输入要添加的心理健康知识文本，将自动分块并向量化…"
          rows={4}
          className="resize-none"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="space-y-1.5 w-full sm:w-36">
          <Label>风险等级</Label>
          <Select
            value={riskLevel}
            onValueChange={(v) => setRiskLevel(v as RiskLevel)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(RISK_LABELS) as [RiskLevel, string][]).map(
                ([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="gap-2 w-full sm:w-auto"
        >
          {isSubmitting ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <PlusIcon className="size-4" />
          )}
          {isSubmitting ? "向量化中…" : "添加内容"}
        </Button>
      </div>

      {result && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm",
            result.ok
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {result.ok ? (
            <CheckCircle2Icon className="size-4 shrink-0" />
          ) : (
            <XCircleIcon className="size-4 shrink-0" />
          )}
          {result.msg}
        </div>
      )}
    </form>
  );
}

// ─── Export Helpers ───────────────────────────────────────────────────────────

function exportChunks(
  source: KnowledgeSource,
  chunks: ChunkRow[],
  format: "json" | "txt",
) {
  let content: string;
  let mimeType: string;
  let ext: string;

  if (format === "json") {
    content = JSON.stringify(
      {
        title: source.title,
        category: source.category,
        chunks: chunks.map((c) => ({
          index: c.chunkIndex,
          riskLevel: c.targetRiskLevel,
          content: c.content,
        })),
      },
      null,
      2,
    );
    mimeType = "application/json";
    ext = "json";
  } else {
    content = chunks
      .map((c) => `[#${c.chunkIndex + 1}]\n${c.content}`)
      .join("\n\n---\n\n");
    mimeType = "text/plain";
    ext = "txt";
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${source.title}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ChunkManager({
  source,
  initialChunks,
}: {
  source: KnowledgeSource;
  initialChunks: ChunkRow[];
}) {
  const router = useRouter();
  const [chunks, setChunks] = useState(initialChunks);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    const res = await deleteChunkAction(deleteTargetId);
    setIsDeleting(false);
    if (res.success) {
      setChunks((prev) => prev.filter((c) => c.id !== deleteTargetId));
    }
    setDeleteTargetId(null);
  }

  function handleAddSuccess() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Add new content */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">添加知识内容</CardTitle>
          <CardDescription>
            输入文本后将自动分块、向量化并存入知识库
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddChunkForm sourceId={source.id} onSuccess={handleAddSuccess} />
        </CardContent>
      </Card>

      {/* Chunk list */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">
                知识内容列表
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  共 {chunks.length} 条
                </span>
              </CardTitle>
              <CardDescription>悬停查看删除按钮</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => exportChunks(source, chunks, "txt")}
                disabled={chunks.length === 0}
              >
                <DownloadIcon className="size-3" />
                TXT
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => exportChunks(source, chunks, "json")}
                disabled={chunks.length === 0}
              >
                <DownloadIcon className="size-3" />
                JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chunks.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              暂无内容，请在上方添加知识文本
            </div>
          ) : (
            <div className="divide-y divide-border">
              {chunks.map((chunk, i) => (
                <ChunkItem
                  key={chunk.id}
                  chunk={chunk}
                  onDeleteRequest={setDeleteTargetId}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTargetId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除此内容块？</AlertDialogTitle>
            <AlertDialogDescription>
              该操作不可撤销，删除后对应向量将从知识库中移除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {isDeleting && <Loader2Icon className="size-4 animate-spin" />}
              {isDeleting ? "删除中…" : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
