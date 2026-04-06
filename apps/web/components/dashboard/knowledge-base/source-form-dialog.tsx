"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Loader2Icon,
  UploadIcon,
  FileTextIcon,
  XIcon,
  CheckCircle2Icon,
  XCircleIcon,
} from "lucide-react";
import {
  createKnowledgeSourceAction,
  updateKnowledgeSourceAction,
  type KnowledgeSourceWithCount,
} from "@/lib/actions/knowledge";
import type { EmotionCategory, RiskLevel } from "@eveheart/rag-db";

// ─── Options ──────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: { value: EmotionCategory; label: string }[] = [
  { value: "general_psychology", label: "通用心理健康" },
  { value: "emotion_management", label: "情绪管理" },
  { value: "crisis_intervention", label: "危机干预" },
  { value: "elder_care", label: "适老化关怀" },
  { value: "therapeutic_dialogue", label: "治疗性对话" },
  { value: "mindfulness", label: "正念冥想" },
  { value: "grief_support", label: "哀伤辅导" },
  { value: "anxiety_relief", label: "焦虑疏导" },
];

const RISK_LEVEL_OPTIONS: { value: RiskLevel; label: string; desc: string }[] =
  [
    { value: "general", label: "通用", desc: "适用于所有对话" },
    { value: "mild", label: "轻度", desc: "轻度情绪困扰" },
    { value: "moderate", label: "中度", desc: "持续情绪困扰" },
    { value: "crisis", label: "危机", desc: "危机干预优先" },
  ];

const MAX_FILE_SIZE_MB = 2;

// ─── Component ────────────────────────────────────────────────────────────────

export function SourceFormDialog({
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
  const isEdit = Boolean(source);

  // Form state
  const [title, setTitle] = useState(source?.title ?? "");
  const [description, setDescription] = useState(source?.description ?? "");
  const [category, setCategory] = useState<EmotionCategory>(
    source?.category ?? "general_psychology",
  );
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("general");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog opens
  function resetForm() {
    setTitle(source?.title ?? "");
    setDescription(source?.description ?? "");
    setCategory(source?.category ?? "general_psychology");
    setRiskLevel("general");
    setContent("");
    setFileName(null);
    setResult(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setResult({ ok: false, msg: `文件过大，最大支持 ${MAX_FILE_SIZE_MB}MB` });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setContent((ev.target?.result as string) ?? "");
      setFileName(file.name);
      setResult(null);
    };
    reader.readAsText(file, "utf-8");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setResult({ ok: false, msg: "请填写知识库名称" });
      return;
    }

    if (!isEdit && !content.trim()) {
      setResult({ ok: false, msg: "请上传文件或填写内容" });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    let res: { success: boolean; error?: string };

    if (isEdit && source) {
      res = await updateKnowledgeSourceAction(source.id, {
        title: title.trim(),
        description: description.trim() || null,
        category,
      });
    } else {
      res = await createKnowledgeSourceAction({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        targetRiskLevel: riskLevel,
        content: content.trim(),
      });
    }

    setIsSubmitting(false);

    if (res.success) {
      setResult({
        ok: true,
        msg: isEdit ? "更新成功" : "知识库创建成功，正在向量化…",
      });
      onSuccess?.();
      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 1200);
    } else {
      setResult({ ok: false, msg: res.error ?? "操作失败，请重试" });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑知识库" : "新建知识库"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "修改知识库的基本信息（内容和向量不会重新生成）"
              : "上传文档后，系统将自动分块并生成向量嵌入"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="kb-title">
              知识库名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="kb-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：CBT 情绪调节技巧手册"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="kb-desc">描述（可选）</Label>
            <Textarea
              id="kb-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要说明该知识库的内容和适用场景"
              maxLength={500}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>
              情绪分类 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as EmotionCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Risk level (create only) */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>适用风险等级</Label>
              <div className="grid grid-cols-2 gap-2">
                {RISK_LEVEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRiskLevel(opt.value)}
                    className={cn(
                      "flex flex-col items-start gap-0.5 rounded-lg border-2 px-3 py-2.5 text-left transition-all",
                      riskLevel === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <span className="text-sm font-semibold">{opt.label}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* File upload (create only) */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>
                上传文档 <span className="text-destructive">*</span>
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md"
                className="hidden"
                onChange={handleFileChange}
              />
              {fileName ? (
                <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
                  <FileTextIcon className="size-4 text-primary shrink-0" />
                  <span className="text-sm flex-1 truncate">{fileName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFileName(null);
                      setContent("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-6 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all"
                >
                  <UploadIcon className="size-6" />
                  <span className="text-sm">点击选择 .txt 或 .md 文件</span>
                  <span className="text-xs">最大 {MAX_FILE_SIZE_MB}MB</span>
                </button>
              )}
            </div>
          )}

          {/* Result message */}
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

          <DialogFooter className="gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                取消
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
              {isSubmitting ? "处理中…" : isEdit ? "保存更改" : "创建并向量化"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
