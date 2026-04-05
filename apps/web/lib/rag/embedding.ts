import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { embed, embedMany } from "ai";

// ─── Embedding Model Factory ──────────────────────────────────────────────────

/**
 * Creates an embedding model instance from environment variables.
 *
 * Required env vars:
 *   EMBEDDING_API_KEY   – API key for the embedding provider (falls back to OPENAI_API_KEY)
 *
 * Optional env vars:
 *   EMBEDDING_BASE_URL  – Base URL (default: OpenAI; any OpenAI-compatible endpoint works)
 *   EMBEDDING_MODEL     – Model ID (default: text-embedding-3-small)
 *
 * Returns null when no API key is configured → RAG silently disabled.
 */
function getEmbeddingModel() {
  const apiKey =
    process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) return null;

  const rawBaseUrl =
    process.env.EMBEDDING_BASE_URL || "https://api.openai.com/v1/";
  const baseURL = rawBaseUrl.endsWith("/") ? rawBaseUrl : rawBaseUrl + "/";
  const modelId = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

  const client = createOpenAICompatible({
    name: "embedding-provider",
    apiKey,
    baseURL,
  });

  return client.textEmbeddingModel(modelId);
}

// ─── Text Chunking ────────────────────────────────────────────────────────────

/**
 * Splits source text into semantically coherent chunks suitable for embedding.
 *
 * Strategy:
 * 1. Split on sentence-ending punctuation (CJK and Latin) followed by whitespace
 *    or double newlines (paragraph boundaries).
 * 2. If a resulting segment exceeds `maxChunkLength`, split further on
 *    commas / semicolons to keep chunks tight.
 * 3. Discard empty or very short segments (< 10 chars).
 *
 * @param text           – Source material to chunk
 * @param maxChunkLength – Soft upper bound per chunk in characters (default 500)
 */
export function chunkText(text: string, maxChunkLength = 500): string[] {
  return text
    .trim()
    .split(/(?<=[。！？.!?])\s+|\n\n+/)
    .flatMap((segment) => {
      if (segment.length <= maxChunkLength) return [segment];
      // Secondary split on clause boundaries when a segment is too long
      return segment.split(/[，；,;]+/).filter((c) => c.trim().length >= 10);
    })
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
}

// ─── Public Embedding API ─────────────────────────────────────────────────────

/**
 * Generates a single embedding vector for the given text.
 *
 * @returns The embedding array, or null when no embedding key is configured.
 */
export async function generateEmbedding(
  text: string,
): Promise<number[] | null> {
  const model = getEmbeddingModel();
  if (!model) return null;

  const { embedding } = await embed({
    model,
    value: text.replaceAll("\n", " "),
  });
  return embedding;
}

/**
 * Batch-generates embeddings for multiple text chunks.
 *
 * @returns Array of `{ content, embedding }` objects,
 *          or null when no embedding key is configured.
 */
export async function generateEmbeddings(
  texts: string[],
): Promise<Array<{ content: string; embedding: number[] }> | null> {
  const model = getEmbeddingModel();
  if (!model || texts.length === 0) return null;

  const { embeddings } = await embedMany({
    model,
    values: texts.map((t) => t.replaceAll("\n", " ")),
  });

  return texts.map((content, i) => ({ content, embedding: embeddings[i] }));
}
