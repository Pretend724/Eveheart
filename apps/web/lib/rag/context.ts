import type { SimilarChunk } from "@eveheart/rag-db";

const CATEGORY_LABELS: Record<string, string> = {
  general_psychology: "心理健康",
  emotion_management: "情绪管理",
  crisis_intervention: "危机干预",
  elder_care: "适老化关怀",
  therapeutic_dialogue: "治疗性对话",
  mindfulness: "正念冥想",
  grief_support: "哀伤支持",
  anxiety_relief: "焦虑疏导",
};

/**
 * Builds the RAG knowledge block that is appended to the system prompt.
 * Keep it compact, but make the grounding requirement explicit.
 */
export function buildRagContext(chunks: SimilarChunk[]): string {
  if (chunks.length === 0) return "";

  const entries = chunks
    .map((chunk, index) => {
      const categoryLabel = CATEGORY_LABELS[chunk.category] ?? chunk.category;

      return [
        `${index + 1}. [领域: ${categoryLabel} | 来源: ${chunk.sourceTitle} | 相似度: ${chunk.similarity.toFixed(3)}]`,
        chunk.content,
      ].join("\n");
    })
    .join("\n\n");

  return [
    "## 专业知识参考（RAG）",
    "以下内容来自 Eveheart 心理健康知识库，并且与当前用户问题相关：",
    "",
    entries,
    "",
    "回答要求：",
    "- 当这些知识与用户问题相关时，优先基于这些知识组织回答。",
    "- 不要忽略这些知识后再泛泛而谈。",
    "- 你的表达要自然，不要逐条复述“知识库原文”。",
    "- 如果知识不足以支撑结论，就保持谨慎，不要编造额外专业事实。",
  ].join("\n");
}

export function chunkContents(chunks: SimilarChunk[]): string[] {
  return chunks.map((chunk) => chunk.content);
}
