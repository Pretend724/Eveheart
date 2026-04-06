import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "./db";
import {
  EMBEDDING_DIMENSIONS,
  knowledgeChunks,
  knowledgeSources,
  type EmotionCategory,
  type RiskLevel,
  type InsertKnowledgeChunk,
  type InsertKnowledgeSource,
} from "../drizzle/schema";

function assertEmbeddingDimensions(embedding: number[], context: string) {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `${context} expects ${EMBEDDING_DIMENSIONS} dimensions, got ${embedding.length}.`,
    );
  }
}

// ─── Return Types ─────────────────────────────────────────────────────────────

export type SimilarChunk = {
  id: string;
  content: string;
  /** Cosine similarity score (0–1, higher = more relevant) */
  similarity: number;
  category: EmotionCategory;
  targetRiskLevel: RiskLevel;
  sourceTitle: string;
};

// ─── Options ──────────────────────────────────────────────────────────────────

export type FindSimilarOptions = {
  /** Maximum number of chunks to return. Default: 5 */
  limit?: number;
  /** Minimum cosine similarity threshold (0–1). Default: 0.55 */
  minSimilarity?: number;
  /** Optionally restrict results to a specific psychological domain */
  category?: EmotionCategory;
  /** Optionally restrict results to a specific risk level */
  riskLevel?: RiskLevel;
};

// ─── Retrieval ────────────────────────────────────────────────────────────────

/**
 * Finds the most semantically similar knowledge chunks for a given embedding.
 *
 * Uses cosine distance (pgvector) with an HNSW index for sub-linear search.
 * Results are ordered by similarity (descending) and filtered by minSimilarity.
 *
 * @param queryEmbedding - Pre-computed embedding of the user's message
 * @param options        - Optional filters and limits
 */
export async function findSimilarChunks(
  queryEmbedding: number[],
  options: FindSimilarOptions = {},
): Promise<SimilarChunk[]> {
  assertEmbeddingDimensions(queryEmbedding, "Query embedding");

  const { limit = 5, minSimilarity = 0.55, category, riskLevel } = options;

  const similarity = sql<number>`1 - (${cosineDistance(
    knowledgeChunks.embedding,
    queryEmbedding,
  )})`;

  const conditions = [gt(similarity, minSimilarity)];
  if (category) {
    conditions.push(eq(knowledgeSources.category, category));
  }
  if (riskLevel) {
    conditions.push(eq(knowledgeChunks.targetRiskLevel, riskLevel));
  }

  return db
    .select({
      id: knowledgeChunks.id,
      content: knowledgeChunks.content,
      similarity,
      category: knowledgeSources.category,
      targetRiskLevel: knowledgeChunks.targetRiskLevel,
      sourceTitle: knowledgeSources.title,
    })
    .from(knowledgeChunks)
    .innerJoin(
      knowledgeSources,
      eq(knowledgeChunks.sourceId, knowledgeSources.id),
    )
    .where(and(...conditions))
    .orderBy(desc(similarity))
    .limit(limit);
}

// ─── Insertion ────────────────────────────────────────────────────────────────

/**
 * Inserts a new knowledge source record and returns its generated UUID.
 */
export async function insertKnowledgeSource(
  source: Omit<InsertKnowledgeSource, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const [result] = await db
    .insert(knowledgeSources)
    .values(source)
    .returning({ id: knowledgeSources.id });
  return result.id;
}

/**
 * Batch-inserts pre-embedded knowledge chunks.
 * Typically called after `insertKnowledgeSource` with the returned sourceId.
 */
export async function insertKnowledgeChunks(
  chunks: Omit<InsertKnowledgeChunk, "id" | "createdAt">[],
): Promise<string[]> {
  if (chunks.length === 0) return [];

  for (const [index, chunk] of chunks.entries()) {
    assertEmbeddingDimensions(
      chunk.embedding,
      `Chunk embedding at index ${index}`,
    );
  }

  const results = await db
    .insert(knowledgeChunks)
    .values(chunks)
    .returning({ id: knowledgeChunks.id });
  return results.map((r) => r.id);
}
