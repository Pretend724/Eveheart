import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@eveheart/db";

// ─── Response Types ───────────────────────────────────────────────────────────

/**
 * A single conversation row returned by this endpoint.
 * Shape mirrors the ConversationRecord type used in the UI columns.
 */
export type ConversationRecordDTO = {
  id: string;
  title: string;
  createdAt: string;
  primaryEmotion: string;
  /** Normalised 0–100 emotion intensity (EmotionLog.score × 100) */
  emotionScore: number;
  /** Short keyword tokens extracted from EmotionLog source utterances */
  keywords: string[];
  messageCount: number;
};

export type ConversationsResponse = {
  data: ConversationRecordDTO[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

// ─── GET /api/conversations ───────────────────────────────────────────────────
/**
 * Returns a paginated list of the authenticated user's chat sessions,
 * enriched with emotion analysis data aggregated from their EmotionLog rows.
 *
 * Query parameters:
 *   page        {number}  – 1-based page index          (default: 1)
 *   pageSize    {number}  – items per page, max 50      (default: 10)
 *   q           {string}  – fuzzy-search on session title
 *   emotion     {string}  – filter by primary emotion label (case-insensitive)
 */
export async function GET(req: NextRequest) {
  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // ── Query params ─────────────────────────────────────────────────────────
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(
        1,
        parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10),
      ),
    );
    const q = searchParams.get("q")?.trim() ?? "";
    const emotionFilter = searchParams.get("emotion")?.trim() ?? "";

    const userId = session.user.id;

    // ── Prisma where clause ───────────────────────────────────────────────────
    const where = {
      userId,
      // Title search (case-insensitive contains)
      ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
      // Emotion filter: at least one EmotionLog with a matching emotion label
      ...(emotionFilter
        ? {
            emotionLogs: {
              some: {
                emotion: {
                  contains: emotionFilter,
                  mode: "insensitive" as const,
                },
              },
            },
          }
        : {}),
    };

    // ── Parallel count + fetch ────────────────────────────────────────────────
    const [total, chatSessions] = await prisma.$transaction([
      prisma.chatSession.count({ where }),
      prisma.chatSession.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          // All emotion logs for this session, sorted highest-score first
          emotionLogs: {
            orderBy: { score: "desc" },
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
    ]);

    // ── Shape response rows ───────────────────────────────────────────────────
    const data: ConversationRecordDTO[] = chatSessions.map((cs) => {
      // The EmotionLog with the highest score is the "primary" emotion
      const topLog = cs.emotionLogs[0] ?? null;
      const primaryEmotion = topLog?.emotion ?? "未检测";

      // EmotionLog.score is stored as 0–1 float; convert to 0–100 integer
      const emotionScore = topLog ? Math.round(topLog.score * 100) : 0;

      // Extract short keyword tokens from the source utterances that triggered
      // each emotion log entry.  Falls back to an empty array gracefully.
      const keywords = extractKeywords(cs.emotionLogs.map((l) => l.source));

      return {
        id: cs.id,
        title: cs.title ?? "未命名会话",
        createdAt: cs.createdAt.toISOString(),
        primaryEmotion,
        emotionScore,
        keywords,
        messageCount: cs._count.messages,
      };
    });

    // ── Return ────────────────────────────────────────────────────────────────
    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    } satisfies ConversationsResponse);
  } catch (error) {
    console.error("[GET /api/conversations] error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extracts unique, meaningful keyword tokens from an array of source strings.
 *
 * Strategy:
 *  1. Split each source on whitespace and common CJK / Latin punctuation.
 *  2. Keep tokens whose length is between 2 and 8 characters.
 *  3. De-duplicate and cap at 8 keywords total.
 *
 * This is a lightweight heuristic. For production, replace with an NLP
 * keyword-extraction service (e.g. jieba + TF-IDF, or an LLM extract call).
 */
function extractKeywords(sources: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const src of sources) {
    if (!src) continue;

    const tokens = src.split(
      /[\s,，。！？、；：""''《》【】「」\(\)\[\]\/\\·…—]+/,
    );

    for (const tok of tokens) {
      const t = tok.trim();
      if (t.length >= 2 && t.length <= 8 && !seen.has(t)) {
        seen.add(t);
        result.push(t);
        if (result.length >= 8) return result;
      }
    }
  }

  return result;
}
