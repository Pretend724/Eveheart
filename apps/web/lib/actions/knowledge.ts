"use server";

import { auth } from "@/lib/auth";
import { insertKnowledgeSource, insertKnowledgeChunks } from "@eveheart/rag-db";
import { generateEmbeddings, chunkText } from "@/lib/rag/embedding";
import type { EmotionCategory, RiskLevel } from "@eveheart/rag-db";

// ─── Input Type ───────────────────────────────────────────────────────────────

export type AddKnowledgeInput = {
  /** Short, descriptive title shown in the knowledge base UI */
  title: string;
  /** Full text content to chunk and embed */
  content: string;
  /** Psychological domain classification */
  category: EmotionCategory;
  /** Minimum risk level this knowledge is applicable to */
  targetRiskLevel?: RiskLevel;
  /** Optional one-line summary */
  description?: string;
  /** Author / source name */
  author?: string;
};

// ─── Result Type ──────────────────────────────────────────────────────────────

export type AddKnowledgeResult = {
  success: boolean;
  /** Number of chunks stored (only present on success) */
  chunkCount?: number;
  /** Human-readable error message (only present on failure) */
  error?: string;
};

// ─── Server Action ────────────────────────────────────────────────────────────

/**
 * Chunks, embeds, and stores a knowledge document in the RAG vector database.
 *
 * Flow:
 *  1. Auth guard → only authenticated users can add knowledge
 *  2. Insert knowledge_source row (metadata)
 *  3. Chunk the raw content
 *  4. Batch-embed all chunks via the configured embedding model
 *  5. Insert all knowledge_chunk rows (content + vector)
 *
 * Note: The embedding step requires EMBEDDING_API_KEY (or OPENAI_API_KEY).
 * If the key is absent, the action returns an informative error instead of
 * throwing, so callers can surface a useful message to the user.
 */
export async function addKnowledgeAction(
  input: AddKnowledgeInput,
): Promise<AddKnowledgeResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "未授权，请先登录。" };
    }

    // ── 1. Create knowledge source ─────────────────────────────────────────
    const sourceId = await insertKnowledgeSource({
      title: input.title.trim(),
      description: input.description?.trim() ?? null,
      category: input.category,
      sourceType: "document",
      author: input.author?.trim() ?? null,
      userId: session.user.id,
      isActive: true,
    });

    // ── 2. Chunk the content ───────────────────────────────────────────────
    const chunks = chunkText(input.content);
    if (chunks.length === 0) {
      return { success: false, error: "内容为空或无法解析，请检查输入。" };
    }

    // ── 3. Generate embeddings ─────────────────────────────────────────────
    const embeddedChunks = await generateEmbeddings(chunks);
    if (!embeddedChunks) {
      return {
        success: false,
        error:
          "嵌入服务未配置。请在 .env 中设置 EMBEDDING_API_KEY，" +
          "然后重试。知识条目元数据已保存，可在配置后重新嵌入。",
      };
    }

    // ── 4. Store chunks ────────────────────────────────────────────────────
    await insertKnowledgeChunks(
      embeddedChunks.map((chunk, i) => ({
        sourceId,
        content: chunk.content,
        chunkIndex: i,
        targetRiskLevel: input.targetRiskLevel ?? "general",
        embedding: chunk.embedding,
      })),
    );

    return { success: true, chunkCount: embeddedChunks.length };
  } catch (error) {
    console.error("[addKnowledgeAction]", error);
    return { success: false, error: "添加失败，请稍后重试。" };
  }
}
