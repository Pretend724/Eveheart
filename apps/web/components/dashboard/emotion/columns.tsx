"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";
import { cn } from "@/lib/utils";

// ─── Data Type ───────────────────────────────────────────────────────────────

/**
 * Represents a single chat session enriched with emotion analysis data,
 * used to populate the Recent Conversations table.
 */
export type ConversationRecord = {
  /** ChatSession.id */
  id: string;
  /** Navigation target for the conversation */
  href?: string;
  /** Session title (may be auto-generated or user-set) */
  title: string;
  /** When the conversation started */
  createdAt: string | Date;
  /** Dominant emotion detected across the session (e.g. "焦虑", "平静") */
  primaryEmotion: string;
  /**
   * Normalised intensity of the primary emotion, 0–100.
   * Derived from EmotionLog.score (which is stored as 0–1 float).
   */
  emotionScore: number;
  /** Optional Tailwind bg-* class override for the emotion dot */
  emotionColorClass?: string;
  /** Thematic keywords extracted from the conversation */
  keywords: string[];
  /** Total number of messages in the session */
  messageCount: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DATE_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(date: string | Date): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return DATE_FORMATTER.format(d);
}

/** Maps well-known Chinese emotion labels to a Tailwind bg colour class. */
const EMOTION_COLOR_MAP: Record<string, string> = {
  开心: "bg-green-500",
  喜悦: "bg-green-400",
  满足: "bg-green-300",
  焦虑: "bg-amber-500",
  担忧: "bg-amber-400",
  紧张: "bg-amber-300",
  平静: "bg-sky-500",
  放松: "bg-sky-400",
  安宁: "bg-sky-300",
  悲伤: "bg-indigo-500",
  难过: "bg-indigo-400",
  失落: "bg-indigo-300",
  愤怒: "bg-red-500",
  烦躁: "bg-red-400",
  沮丧: "bg-red-300",
  兴奋: "bg-violet-500",
  激动: "bg-violet-400",
  期待: "bg-violet-300",
};

function resolveEmotionColor(emotion: string, override?: string): string {
  if (override) return override;
  return EMOTION_COLOR_MAP[emotion] ?? "bg-primary";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * A thin horizontal progress bar that visualises the emotion intensity score.
 * Colour transitions: green ≥ 70 · amber 40–69 · red < 40
 */
function EmotionScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(score)));

  const barColor =
    pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-400";

  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="relative flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-300",
            barColor,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="tabular-nums text-xs text-muted-foreground w-8 text-right shrink-0">
        {pct}
      </span>
    </div>
  );
}

/**
 * Renders up to `max` keyword badges, with an overflow counter if there are more.
 */
function KeywordList({
  keywords,
  max = 4,
}: {
  keywords: string[];
  max?: number;
}) {
  const visible = keywords.slice(0, max);
  const overflow = keywords.length - max;

  return (
    <div className="flex flex-wrap gap-1 max-w-[200px]">
      {visible.map((kw) => (
        <Badge
          key={kw}
          variant="outline"
          className="h-[18px] px-1.5 text-[10px] font-normal text-muted-foreground"
        >
          {kw}
        </Badge>
      ))}
      {overflow > 0 && (
        <Badge
          variant="outline"
          className="h-[18px] px-1.5 text-[10px] font-normal text-muted-foreground/60"
        >
          +{overflow}
        </Badge>
      )}
    </div>
  );
}

// ─── Column Definitions ───────────────────────────────────────────────────────

export const conversationColumns: ColumnDef<ConversationRecord>[] = [
  // ── Select ──────────────────────────────────────────────────────────────────
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // ── Title ───────────────────────────────────────────────────────────────────
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="会话标题" />
    ),
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      const href = row.original.href ?? "#";

      return (
        <Link
          href={href}
          className="block max-w-[180px] text-sm font-medium line-clamp-1 hover:text-primary hover:underline"
        >
          {title}
        </Link>
      );
    },
  },

  // ── Created At ──────────────────────────────────────────────────────────────
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="交谈时间" />
    ),
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(row.getValue("createdAt"))}
      </span>
    ),
    sortingFn: "datetime",
  },

  // ── Primary Emotion ─────────────────────────────────────────────────────────
  {
    accessorKey: "primaryEmotion",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="主要情绪" />
    ),
    cell: ({ row }) => {
      const emotion = row.getValue("primaryEmotion") as string;
      const colorClass = row.original.emotionColorClass;
      return (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-block size-2 rounded-full shrink-0",
              resolveEmotionColor(emotion, colorClass),
            )}
          />
          <Badge
            variant="secondary"
            className="h-5 px-2 text-[11px] font-normal"
          >
            {emotion}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },

  // ── Emotion Score ───────────────────────────────────────────────────────────
  {
    accessorKey: "emotionScore",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="情绪值" />
    ),
    cell: ({ row }) => <EmotionScoreBar score={row.getValue("emotionScore")} />,
  },

  // ── Keywords ────────────────────────────────────────────────────────────────
  {
    accessorKey: "keywords",
    header: "关键词",
    enableSorting: false,
    cell: ({ row }) => <KeywordList keywords={row.getValue("keywords")} />,
  },

  // ── Message Count ────────────────────────────────────────────────────────────
  {
    accessorKey: "messageCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="消息数" />
    ),
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground tabular-nums text-center block">
        {row.getValue("messageCount")}
      </span>
    ),
  },

  // ── Actions ─────────────────────────────────────────────────────────────────
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const convo = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">打开菜单</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>操作</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(convo.id)}
            >
              复制会话 ID
            </DropdownMenuItem>
            <DropdownMenuItem>查看详情</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
              删除记录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
