import type { UIMessage } from "ai";
import { findSimilarChunks } from "@eveheart/rag-db";
import { generateEmbedding } from "@/lib/rag/embedding";
import { buildRagContext } from "@/lib/rag/context";

const PRIMARY_RAG_SIMILARITY = 0.55;
const FALLBACK_RAG_SIMILARITY = 0.3;
const RAG_LIMIT = 5;

export function extractLatestUserText(messages: UIMessage[]): string {
  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  if (!lastUserMessage) return "";

  return (
    lastUserMessage.parts
      ?.filter(
        (part): part is { type: "text"; text: string } => part.type === "text",
      )
      .map((part) => part.text)
      .join(" ")
      .trim() ?? ""
  );
}

export async function retrieveRagContext(
  messages: UIMessage[],
): Promise<string> {
  const textContent = extractLatestUserText(messages);
  if (!textContent) return "";

  const queryEmbedding = await generateEmbedding(textContent);
  if (!queryEmbedding) return "";

  let chunks = await findSimilarChunks(queryEmbedding, {
    limit: RAG_LIMIT,
    minSimilarity: PRIMARY_RAG_SIMILARITY,
  });

  if (chunks.length === 0) {
    chunks = await findSimilarChunks(queryEmbedding, {
      limit: RAG_LIMIT,
      minSimilarity: FALLBACK_RAG_SIMILARITY,
    });
  }

  if (chunks.length === 0) return "";

  console.info(
    "[chat] RAG matched chunks:",
    chunks.map((chunk) => ({
      id: chunk.id,
      sourceTitle: chunk.sourceTitle,
      similarity: Number(chunk.similarity.toFixed(3)),
    })),
  );

  return buildRagContext(chunks);
}

export function injectRagIntoMessages(
  messages: UIMessage[],
  ragContext: string,
): UIMessage[] {
  if (!ragContext) return messages;

  const lastUserMessageIndex = [...messages]
    .map((message, index) => ({ message, index }))
    .reverse()
    .find(({ message }) => message.role === "user")?.index;

  if (lastUserMessageIndex === undefined) return messages;

  const nextMessages = structuredClone(messages);
  const targetMessage = nextMessages[lastUserMessageIndex];

  const lastTextPartIndex = [...targetMessage.parts]
    .map((part, index) => ({ part, index }))
    .reverse()
    .find(({ part }) => part.type === "text")?.index;

  if (lastTextPartIndex === undefined) return messages;

  const textPart = targetMessage.parts[lastTextPartIndex];
  if (textPart.type !== "text") return messages;

  targetMessage.parts[lastTextPartIndex] = {
    ...textPart,
    text: [
      "请结合下面提供的知识库内容，优先根据知识库回答我的问题。",
      "如果知识库中已经包含答案，就直接使用这些内容，不要泛泛而谈。",
      "",
      ragContext,
      "",
      "我的问题是：",
      textPart.text,
    ].join("\n"),
  };

  return nextMessages;
}
