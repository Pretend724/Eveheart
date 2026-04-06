import { getKnowledgeSourceByIdAction } from "@/lib/actions/knowledge";
import { ChunkManager } from "@/components/dashboard/knowledge-base/chunk-manager";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmotionCategory } from "@eveheart/rag-db";

// ─── Label Maps ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<EmotionCategory, string> = {
  general_psychology: "通用心理健康",
  emotion_management: "情绪管理",
  crisis_intervention: "危机干预",
  elder_care: "适老化关怀",
  therapeutic_dialogue: "治疗性对话",
  mindfulness: "正念冥想",
  grief_support: "哀伤辅导",
  anxiety_relief: "焦虑疏导",
};

const CATEGORY_COLORS: Record<EmotionCategory, string> = {
  general_psychology: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  emotion_management: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  crisis_intervention: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  elder_care: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  therapeutic_dialogue: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  mindfulness: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  grief_support: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  anxiety_relief: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function KnowledgeBaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const result = await getKnowledgeSourceByIdAction(id);

  if (!result.success || !result.data) notFound();

  const { chunks, ...source } = result.data;

  const createdAt = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(source.createdAt));

  return (
    <main className="p-5 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back button */}
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" asChild>
          <Link href="/dashboard/knowledge-base">
            <ArrowLeftIcon className="size-4" />
            返回知识库列表
          </Link>
        </Button>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-start gap-3">
            <h2 className="font-headline text-3xl font-extrabold text-foreground tracking-tight flex-1">
              {source.title}
            </h2>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shrink-0",
                CATEGORY_COLORS[source.category],
              )}
            >
              {CATEGORY_LABELS[source.category]}
            </span>
          </div>

          {source.description && (
            <p className="text-muted-foreground">{source.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {source.author && <span>作者：{source.author}</span>}
            <span>创建于：{createdAt}</span>
            <span>
              共{" "}
              <strong className="text-foreground">{chunks.length}</strong> 条知识内容
            </span>
          </div>
        </div>

        {/* Chunk manager */}
        <ChunkManager source={source} initialChunks={chunks} />
      </div>
    </main>
  );
}
