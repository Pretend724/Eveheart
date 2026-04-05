import type { SimilarChunk } from "@eveheart/rag-db";

// ─── Category Labels ──────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  general_psychology: "心理健康",
  emotion_management: "情绪管理",
  crisis_intervention: "危机干预",
  elder_care: "适老化关怀",
  therapeutic_dialogue: "治疗性对话",
  mindfulness: "正念冥想",
  grief_support: "哀伤辅导",
  anxiety_relief: "焦虑疏导",
};

// ─── Context Builder ──────────────────────────────────────────────────────────

/**
 * Builds a RAG context block from retrieved knowledge chunks.
 *
 * The resulting string is appended to the system prompt so the model can
 * reference domain-specific psychology knowledge when forming its reply.
 *
 * Design principles:
 * - Keep the injection concise to minimise token cost
 * - Instruct the model to integrate (not quote) the knowledge
 * - Return an empty string when no chunks were retrieved (zero overhead)
 *
 * @param chunks - Chunks returned by `findSimilarChunks`
 */
export function buildRagContext(chunks: SimilarChunk[]): string {
  if (chunks.length === 0) return "";

  const entries = chunks
    .map((chunk, i) => {
      const label =
        CATEGORY_LABELS[chunk.category] ?? chunk.category;
      return `${i + 1}. [领域: ${label} | 来源: ${chunk.sourceTitle}]\n${chunk.content}`;
    })
    .join("\n\n");

  return `

## 专业知识参考（RAG）
以下内容来自 Eveheart 心理健康知识库，与当前对话高度相关，供你参考：

${entries}

请将以上专业知识自然地融入你的回应，而不是直接引用或列举。保持共情语气，让用户感受到温暖与专业并重。`;
}

/**
 * Extracts plain text content from all chunks (for logging / debugging).
 */
export function chunkContents(chunks: SimilarChunk[]): string[] {
  return chunks.map((c) => c.content);
}
