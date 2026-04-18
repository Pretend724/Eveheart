"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  PlusIcon,
  SearchIcon,
  BookOpenIcon,
  TrashIcon,
  PencilIcon,
  FileTextIcon,
  CalendarIcon,
  HashIcon,
} from "lucide-react";
import Link from "next/link";
import type { KnowledgeSourceWithCount } from "@/lib/actions/knowledge";
import type { EmotionCategory } from "@eveheart/rag-db";
import { SourceFormDialog } from "./source-form-dialog";
import { DeleteSourceDialog } from "./delete-source-dialog";

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
  general_psychology:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  emotion_management:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  crisis_intervention:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  elder_care:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  therapeutic_dialogue:
    "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  mindfulness: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  grief_support:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  anxiety_relief:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

const DATE_FMT = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

// ─── Source Card ──────────────────────────────────────────────────────────────

function SourceCard({
  source,
  onEdit,
  onDelete,
}: {
  source: KnowledgeSourceWithCount;
  onEdit: (s: KnowledgeSourceWithCount) => void;
  onDelete: (s: KnowledgeSourceWithCount) => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold line-clamp-2 flex-1">
            {source.title}
          </CardTitle>
          <span
            className={cn(
              "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
              CATEGORY_COLORS[source.category],
            )}
          >
            {CATEGORY_LABELS[source.category]}
          </span>
        </div>
        {source.description && (
          <CardDescription className="line-clamp-2 text-xs mt-1">
            {source.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-2">
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <HashIcon className="size-3" />
            {source.chunkCount} 条内容
          </span>
          <span className="flex items-center gap-1">
            <CalendarIcon className="size-3" />
            {DATE_FMT.format(new Date(source.createdAt))}
          </span>
          {source.author && (
            <span className="flex items-center gap-1">
              <FileTextIcon className="size-3" />
              {source.author}
            </span>
          )}
        </div>
      </CardContent>

      <Separator />

      <CardFooter className="pt-3 flex items-center gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" asChild>
          <Link href={`/dashboard/knowledge-base/${source.id}`}>
            <BookOpenIcon className="size-3.5" />
            查看详情
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => onEdit(source)}
        >
          <PencilIcon className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(source)}
        >
          <TrashIcon className="size-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="size-16 rounded-full bg-muted flex items-center justify-center">
        <BookOpenIcon className="size-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-foreground">心理健康知识库</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          系统内置专业心理知识，可自由添加自定义内容，为你的每一次对话提供专业支持
        </p>
      </div>
      <Button onClick={onNew} className="gap-2 mt-2">
        <PlusIcon className="size-4" />
        新建知识库
      </Button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function KnowledgeBaseClient({
  initialSources,
}: {
  initialSources: KnowledgeSourceWithCount[];
}) {
  const router = useRouter();

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editSource, setEditSource] = useState<KnowledgeSourceWithCount | null>(
    null,
  );
  const [deleteSource, setDeleteSource] =
    useState<KnowledgeSourceWithCount | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<EmotionCategory | "all">(
    "all",
  );

  // Filtered list
  const filtered = useMemo(() => {
    return initialSources.filter((s) => {
      const matchSearch =
        !search ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        (s.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        categoryFilter === "all" || s.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [initialSources, search, categoryFilter]);

  function handleSuccess() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="搜索知识库名称或描述…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as EmotionCategory | "all")}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {(
              Object.entries(CATEGORY_LABELS) as [EmotionCategory, string][]
            ).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setCreateOpen(true)} className="gap-2 shrink-0">
          <PlusIcon className="size-4" />
          新建知识库
        </Button>
      </div>

      {/* Stats row */}
      {initialSources.length > 0 && (
        <p className="text-sm text-muted-foreground">
          共{" "}
          <strong className="text-foreground">{initialSources.length}</strong>{" "}
          个知识库
          {filtered.length !== initialSources.length && (
            <>
              ，当前筛选{" "}
              <strong className="text-foreground">{filtered.length}</strong> 个
            </>
          )}
        </p>
      )}

      {/* Content */}
      {initialSources.length === 0 ? (
        <EmptyState onNew={() => setCreateOpen(true)} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <SearchIcon className="size-8 text-muted-foreground" />
          <p className="font-medium">没有匹配的知识库</p>
          <p className="text-sm text-muted-foreground">
            尝试修改搜索词或筛选条件
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              onEdit={setEditSource}
              onDelete={setDeleteSource}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <SourceFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleSuccess}
      />
      <SourceFormDialog
        open={editSource !== null}
        onOpenChange={(open) => {
          if (!open) setEditSource(null);
        }}
        source={editSource ?? undefined}
        onSuccess={handleSuccess}
      />
      <DeleteSourceDialog
        open={deleteSource !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteSource(null);
        }}
        source={deleteSource ?? undefined}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
