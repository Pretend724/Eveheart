import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { embed, embedMany } from "ai";
import { EMBEDDING_DIMENSIONS } from "@eveheart/rag-db";

const EMBEDDING_PROVIDER_NAME = "embedding-provider";

// ─── Embedding Model Factory ──────────────────────────────────────────────────

/**
 * Creates an embedding model instance from environment variables.
 *
 * Required env vars:
 *   EMBEDDING_API_KEY   – API key for the embedding provider (falls back to OPENAI_API_KEY)
 *   EMBEDDING_MODEL     – Model ID for the active 1024-dimensional embedding model
 *
 * Optional env vars:
 *   EMBEDDING_BASE_URL  – Base URL (default: OpenAI; any OpenAI-compatible endpoint works)
 *
 * Returns null when no API key is configured → RAG silently disabled.
 */
function getEmbeddingModel() {
  const apiKey =
    process.env.EMBEDDING_API_KEY || process.env.SILICONFLOW_API_KEY;

  if (!apiKey) return null;

  const rawBaseUrl =
    process.env.EMBEDDING_BASE_URL || "https://api.siliconflow.cn/v1/";
  const baseURL = rawBaseUrl.endsWith("/") ? rawBaseUrl : rawBaseUrl + "/";
  const modelId = process.env.EMBEDDING_MODEL?.trim();

  if (!modelId) {
    throw new Error(
      `EMBEDDING_MODEL must be set to the ${EMBEDDING_DIMENSIONS}-dimensional embedding model.`,
    );
  }

  const client = createOpenAICompatible({
    name: EMBEDDING_PROVIDER_NAME,
    apiKey,
    baseURL,
  });

  return {
    model: client.textEmbeddingModel(modelId),
    modelId,
  };
}

function getEmbeddingProviderOptions() {
  return {
    [EMBEDDING_PROVIDER_NAME]: {
      dimensions: EMBEDDING_DIMENSIONS,
    },
  };
}

function assertEmbeddingDimensions(embedding: number[], modelId: string) {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding model "${modelId}" returned ${embedding.length} dimensions, expected ${EMBEDDING_DIMENSIONS}.`,
    );
  }
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
export function generateChunks(text: string, maxChunkLength = 500): string[] {
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

export const chunkText = generateChunks;

// ─── Public Embedding API ─────────────────────────────────────────────────────

/**
 * Generates a single embedding vector for the given text.
 *
 * @returns The embedding array, or null when no embedding key is configured.
 */
export async function generateEmbedding(
  text: string,
): Promise<number[] | null> {
  const modelConfig = getEmbeddingModel();
  if (!modelConfig) return null;

  const { embedding } = await embed({
    model: modelConfig.model,
    value: text.replaceAll("\n", " "),
    providerOptions: getEmbeddingProviderOptions(),
  });

  assertEmbeddingDimensions(embedding, modelConfig.modelId);
  return embedding;
}

/**
 * Batch-generates embeddings for multiple text chunks.
 *
 * @returns Array of `{ content, embedding }` objects,
 *          or null when no embedding key is configured.
 */
export async function generateEmbeddings(
  value: string | string[],
): Promise<Array<{ content: string; embedding: number[] }> | null> {
  const chunks = Array.isArray(value) ? value : generateChunks(value);
  const modelConfig = getEmbeddingModel();
  if (!modelConfig || chunks.length === 0) return null;

  const { embeddings } = await embedMany({
    model: modelConfig.model,
    values: chunks.map((chunk) => chunk.replaceAll("\n", " ")),
    providerOptions: getEmbeddingProviderOptions(),
  });

  for (const embedding of embeddings) {
    assertEmbeddingDimensions(embedding, modelConfig.modelId);
  }

  return chunks.map((content, i) => ({ content, embedding: embeddings[i] }));
}
