"use server";

import { auth } from "@/lib/auth";
import {
  db,
  knowledgeSources,
  knowledgeChunks,
  insertKnowledgeSource,
  insertKnowledgeChunks,
  type EmotionCategory,
  type RiskLevel,
  type KnowledgeSource,
} from "@eveheart/rag-db";
import { generateEmbeddings } from "@/lib/rag/embedding";
import { eq, and, desc, count, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Shared Return Types ──────────────────────────────────────────────────────

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Extended Row Types ───────────────────────────────────────────────────────

export type KnowledgeSourceWithCount = KnowledgeSource & {
  chunkCount: number;
};

export type ChunkRow = {
  id: string;
  content: string;
  chunkIndex: number;
  targetRiskLevel: RiskLevel;
  createdAt: Date;
};

export type SourceWithChunks = KnowledgeSource & {
  chunks: ChunkRow[];
};

// ─── 1. getKnowledgeSourcesAction ────────────────────────────────────────────

/**
 * Returns all active knowledge sources belonging to the current user,
 * enriched with the count of their associated chunks.
 */
export async function getKnowledgeSourcesAction(): Promise<
  ActionResult<KnowledgeSourceWithCount[]>
> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "未授权" };

  const sources = await db
    .select()
    .from(knowledgeSources)
    .where(
      and(
        eq(knowledgeSources.userId, session.user.id),
        eq(knowledgeSources.isActive, true),
      ),
    )
    .orderBy(desc(knowledgeSources.createdAt));

  if (sources.length === 0) {
    return { success: true, data: [] };
  }

  const sourceIds = sources.map((s) => s.id);
  const counts = await db
    .select({
      sourceId: knowledgeChunks.sourceId,
      count: count(),
    })
    .from(knowledgeChunks)
    .where(inArray(knowledgeChunks.sourceId, sourceIds))
    .groupBy(knowledgeChunks.sourceId);

  const countMap = Object.fromEntries(
    counts.map((c) => [c.sourceId, Number(c.count)]),
  );

  return {
    success: true,
    data: sources.map((s) => ({ ...s, chunkCount: countMap[s.id] ?? 0 })),
  };
}

// ─── 2. getKnowledgeSourceByIdAction ─────────────────────────────────────────

/**
 * Returns a single knowledge source and all its chunks (without embeddings).
 * Returns null data if the source is not found or not owned by the current user.
 */
export async function getKnowledgeSourceByIdAction(
  id: string,
): Promise<ActionResult<SourceWithChunks | null>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "未授权" };

  const [source] = await db
    .select()
    .from(knowledgeSources)
    .where(
      and(
        eq(knowledgeSources.id, id),
        eq(knowledgeSources.userId, session.user.id),
        eq(knowledgeSources.isActive, true),
      ),
    )
    .limit(1);

  if (!source) return { success: true, data: null };

  const chunks = await db
    .select({
      id: knowledgeChunks.id,
      content: knowledgeChunks.content,
      chunkIndex: knowledgeChunks.chunkIndex,
      targetRiskLevel: knowledgeChunks.targetRiskLevel,
      createdAt: knowledgeChunks.createdAt,
    })
    .from(knowledgeChunks)
    .where(eq(knowledgeChunks.sourceId, id))
    .orderBy(knowledgeChunks.chunkIndex);

  return { success: true, data: { ...source, chunks } };
}

// ─── 3. createKnowledgeSourceAction ──────────────────────────────────────────

export type CreateKnowledgeSourceInput = {
  title: string;
  content: string;
  category: EmotionCategory;
  targetRiskLevel?: RiskLevel;
  description?: string;
  author?: string;
};

/**
 * Creates a new knowledge source, chunks its content, generates embeddings,
 * and stores the resulting chunk rows.
 */
export async function createKnowledgeSourceAction(
  input: CreateKnowledgeSourceInput,
): Promise<ActionResult<{ sourceId: string; chunkCount: number }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "未授权" };

  const title = input.title.trim();
  if (!title) return { success: false, error: "知识库名称不能为空" };

  const sourceId = await insertKnowledgeSource({
    title,
    description: input.description?.trim() || null,
    category: input.category,
    sourceType: "document",
    author: input.author?.trim() || null,
    userId: session.user.id,
    isActive: true,
  });

  let embedded;
  try {
    embedded = await generateEmbeddings(input.content);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "生成嵌入失败，请检查模型配置",
    };
  }

  if (!embedded) {
    return {
      success: false,
      error: "嵌入服务未配置，请在 .env 中设置 EMBEDDING_API_KEY 和 EMBEDDING_MODEL",
    };
  }

  await insertKnowledgeChunks(
    embedded.map((c, i) => ({
      sourceId,
      content: c.content,
      chunkIndex: i,
      targetRiskLevel: input.targetRiskLevel ?? "general",
      embedding: c.embedding,
    })),
  );

  revalidatePath("/dashboard/knowledge-base");
  return { success: true, data: { sourceId, chunkCount: embedded.length } };
}

// ─── 4. updateKnowledgeSourceAction ──────────────────────────────────────────

export type UpdateKnowledgeSourceInput = {
  title?: string;
  description?: string | null;
  category?: EmotionCategory;
  author?: string | null;
};

/**
 * Updates the metadata of an existing knowledge source.
 * Does NOT re-embed content — only title, description, category, author.
 */
export async function updateKnowledgeSourceAction(
  id: string,
  input: UpdateKnowledgeSourceInput,
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "未授权" };

  const [existing] = await db
    .select({ id: knowledgeSources.id })
    .from(knowledgeSources)
    .where(
      and(
        eq(knowledgeSources.id, id),
        eq(knowledgeSources.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!existing) return { success: false, error: "知识库不存在" };

  await db
    .update(knowledgeSources)
    .set({
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.description !== undefined && {
        description: input.description?.trim() || null,
      }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.author !== undefined && {
        author: input.author?.trim() || null,
      }),
      updatedAt: new Date(),
    })
    .where(eq(knowledgeSources.id, id));

  revalidatePath("/dashboard/knowledge-base");
  revalidatePath(`/dashboard/knowledge-base/${id}`);
  return { success: true, data: undefined };
}

// ─── 5. deleteKnowledgeSourceAction ──────────────────────────────────────────

/**
 * Hard-deletes a knowledge source and all associated chunks.
 * Chunk deletion is handled by the ON DELETE CASCADE constraint in the schema.
 */
export async function deleteKnowledgeSourceAction(
  id: string,
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "未授权" };

  const [existing] = await db
    .select({ id: knowledgeSources.id, userId: knowledgeSources.userId })
    .from(knowledgeSources)
    .where(eq(knowledgeSources.id, id))
    .limit(1);

  if (!existing || existing.userId !== session.user.id) {
    return { success: false, error: "知识库不存在或无权限删除" };
  }

  await db.delete(knowledgeSources).where(eq(knowledgeSources.id, id));

  revalidatePath("/dashboard/knowledge-base");
  return { success: true, data: undefined };
}

// ─── 6. deleteChunkAction ─────────────────────────────────────────────────────

/**
 * Deletes a single knowledge chunk by ID.
 * Verifies ownership through the parent source.
 */
export async function deleteChunkAction(
  chunkId: string,
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "未授权" };

  // Verify ownership via the parent source
  const [chunk] = await db
    .select({ sourceId: knowledgeChunks.sourceId })
    .from(knowledgeChunks)
    .where(eq(knowledgeChunks.id, chunkId))
    .limit(1);

  if (!chunk) return { success: false, error: "内容块不存在" };

  const [source] = await db
    .select({ userId: knowledgeSources.userId })
    .from(knowledgeSources)
    .where(eq(knowledgeSources.id, chunk.sourceId))
    .limit(1);

  if (!source || source.userId !== session.user.id) {
    return { success: false, error: "无权限删除此内容块" };
  }

  await db.delete(knowledgeChunks).where(eq(knowledgeChunks.id, chunkId));

  revalidatePath(`/dashboard/knowledge-base/${chunk.sourceId}`);
  return { success: true, data: undefined };
}

// ─── 7. addChunkToSourceAction ────────────────────────────────────────────────

/**
 * Chunks, embeds, and appends new content to an existing knowledge source.
 */
export async function addChunkToSourceAction(
  sourceId: string,
  content: string,
  targetRiskLevel: RiskLevel = "general",
): Promise<ActionResult<{ chunkCount: number }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "未授权" };

  const [source] = await db
    .select({ userId: knowledgeSources.userId })
    .from(knowledgeSources)
    .where(eq(knowledgeSources.id, sourceId))
    .limit(1);

  if (!source || source.userId !== session.user.id) {
    return { success: false, error: "知识库不存在或无权限" };
  }

  let embedded;
  try {
    embedded = await generateEmbeddings(content);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "生成嵌入失败，请检查模型配置",
    };
  }

  if (!embedded) {
    return { success: false, error: "嵌入服务未配置，请检查 EMBEDDING_API_KEY 和 EMBEDDING_MODEL" };
  }

  // Get current max chunkIndex
  const existing = await db
    .select({ chunkIndex: knowledgeChunks.chunkIndex })
    .from(knowledgeChunks)
    .where(eq(knowledgeChunks.sourceId, sourceId))
    .orderBy(desc(knowledgeChunks.chunkIndex))
    .limit(1);

  const startIndex = existing.length > 0 ? existing[0].chunkIndex + 1 : 0;

  await insertKnowledgeChunks(
    embedded.map((c, i) => ({
      sourceId,
      content: c.content,
      chunkIndex: startIndex + i,
      targetRiskLevel,
      embedding: c.embedding,
    })),
  );

  revalidatePath(`/dashboard/knowledge-base/${sourceId}`);
  return { success: true, data: { chunkCount: embedded.length } };
}
