// ─── Database Client ──────────────────────────────────────────────────────────
export { db } from "./lib/db";

// ─── Schema: types, tables, enums ────────────────────────────────────────────
export {
  // Tables
  knowledgeSources,
  knowledgeChunks,
  // Enums
  emotionCategoryEnum,
  riskLevelEnum,
  // Constants
  EMBEDDING_DIMENSIONS,
  // TypeScript types
  type EmotionCategory,
  type RiskLevel,
  type KnowledgeSource,
  type InsertKnowledgeSource,
  type KnowledgeChunk,
  type InsertKnowledgeChunk,
  // Drizzle relations (needed for joins)
  knowledgeSourcesRelations,
  knowledgeChunksRelations,
} from "./drizzle/schema";

// ─── Retrieval API ────────────────────────────────────────────────────────────
export {
  findSimilarChunks,
  insertKnowledgeSource,
  insertKnowledgeChunks,
  type SimilarChunk,
  type FindSimilarOptions,
} from "./lib/retrieval";
