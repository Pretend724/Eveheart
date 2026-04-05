import {
  pgTable,
  pgEnum,
  text,
  varchar,
  integer,
  boolean,
  uuid,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

/**
 * Categorises knowledge entries by their psychological domain.
 * Used for targeted retrieval and UI organisation.
 */
export const emotionCategoryEnum = pgEnum("emotion_category", [
  "general_psychology",   // 通用心理健康知识
  "emotion_management",   // 情绪管理技术（CBT、DBT 等）
  "crisis_intervention",  // 危机干预与自杀预防
  "elder_care",           // 适老化关怀（50+ 用户）
  "therapeutic_dialogue", // 治疗性对话范例与话术
  "mindfulness",          // 正念冥想与放松练习
  "grief_support",        // 哀伤辅导与失落处理
  "anxiety_relief",       // 焦虑疏导与压力管理
]);

export type EmotionCategory = (typeof emotionCategoryEnum.enumValues)[number];

/**
 * Emotion risk level classification.
 * Determines which knowledge is surfaced in RAG based on detected emotional state.
 *
 * general  → 日常情绪波动，适合所有对话
 * mild     → 轻度情绪困扰（疲劳、轻微焦虑）
 * moderate → 中度困扰（持续情绪低落、社交退缩）
 * crisis   → 危机状态（自伤念头、极度情绪失控）
 */
export const riskLevelEnum = pgEnum("risk_level", [
  "general",
  "mild",
  "moderate",
  "crisis",
]);

export type RiskLevel = (typeof riskLevelEnum.enumValues)[number];

// ─── Dimension Constant ───────────────────────────────────────────────────────

/** Embedding dimension for OpenAI text-embedding-3-small (default). */
export const EMBEDDING_DIMENSIONS = 1536;

// ─── knowledge_sources ────────────────────────────────────────────────────────

/**
 * Represents a complete knowledge document (book chapter, guideline, article).
 * Each source is chunked into knowledgeChunks for vector storage.
 */
export const knowledgeSources = pgTable("knowledge_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),

  /** Psychological domain classification */
  category: emotionCategoryEnum("category").notNull(),

  /** "document" | "guideline" | "case" | "manual" */
  sourceType: varchar("source_type", { length: 50 }).notNull().default("document"),

  author: varchar("author", { length: 200 }),

  /** null = system-level content; uuid = user who uploaded it */
  userId: uuid("user_id"),

  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── knowledge_chunks ─────────────────────────────────────────────────────────

/**
 * Individual text chunks from a knowledge source, stored with their vector
 * embeddings for cosine-similarity retrieval.
 *
 * The HNSW index provides sub-linear approximate nearest-neighbour search,
 * which is essential for low-latency retrieval during chat.
 */
export const knowledgeChunks = pgTable(
  "knowledge_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    sourceId: uuid("source_id")
      .notNull()
      .references(() => knowledgeSources.id, { onDelete: "cascade" }),

    /** Verbatim text of the chunk */
    content: text("content").notNull(),

    /** Zero-based position within the parent source */
    chunkIndex: integer("chunk_index").notNull().default(0),

    /**
     * The minimum emotional risk level this chunk is intended for.
     * During retrieval, chunks are filtered to match or exceed the
     * detected risk level of the current conversation.
     */
    targetRiskLevel: riskLevelEnum("target_risk_level")
      .notNull()
      .default("general"),

    /** pgvector embedding (dimensions must match EMBEDDING_DIMENSIONS) */
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // HNSW index for fast approximate nearest-neighbour search
    index("knowledge_chunks_embedding_hnsw_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
    // B-tree index for source-based filtering
    index("knowledge_chunks_source_id_idx").on(table.sourceId),
    // Composite index for risk-level filtering
    index("knowledge_chunks_risk_level_idx").on(table.targetRiskLevel),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const knowledgeSourcesRelations = relations(
  knowledgeSources,
  ({ many }) => ({
    chunks: many(knowledgeChunks),
  }),
);

export const knowledgeChunksRelations = relations(
  knowledgeChunks,
  ({ one }) => ({
    source: one(knowledgeSources, {
      fields: [knowledgeChunks.sourceId],
      references: [knowledgeSources.id],
    }),
  }),
);

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type KnowledgeSource = typeof knowledgeSources.$inferSelect;
export type InsertKnowledgeSource = typeof knowledgeSources.$inferInsert;

export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
export type InsertKnowledgeChunk = typeof knowledgeChunks.$inferInsert;
