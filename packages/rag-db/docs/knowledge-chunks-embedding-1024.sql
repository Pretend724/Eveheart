-- Safe staged migration for rag.knowledge_chunks embedding dimension:
--   legacy vector/halfvec -> halfvec(1024)
--
-- Why staged?
-- - pgvector dimensions are part of the physical type.
-- - Existing 1536-dim or 2560-dim vectors cannot be losslessly converted to 1024 dims.
-- - The safe path is: backup -> add staging column -> re-embed from content
--   -> validate -> swap columns.
--
-- Important:
-- - Freeze writes to rag.knowledge_chunks during the migration window, or make
--   the application dual-write to embedding_v2 before the final swap.
-- - knowledge_sources is not modified by this migration.

SELECT COUNT(*) AS total_chunks
FROM "rag"."knowledge_chunks";

SELECT COUNT(*) AS missing_content_rows
FROM "rag"."knowledge_chunks"
WHERE "content" IS NULL OR btrim("content") = '';

SELECT
  format_type(a.atttypid, a.atttypmod) AS embedding_type
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'rag'
  AND c.relname = 'knowledge_chunks'
  AND a.attname = 'embedding'
  AND NOT a.attisdropped;

SELECT vector_dims("embedding") AS current_dims
FROM "rag"."knowledge_chunks"
LIMIT 20;

-- ---------------------------------------------------------------------------
-- Fast path for empty tables
-- ---------------------------------------------------------------------------
--
-- If total_chunks = 0, you can skip the staged migration and run only:
--
-- BEGIN;
-- DROP INDEX IF EXISTS "rag"."knowledge_chunks_embedding_hnsw_idx";
-- ALTER TABLE "rag"."knowledge_chunks" DROP COLUMN "embedding";
-- ALTER TABLE "rag"."knowledge_chunks"
--   ADD COLUMN "embedding" halfvec(1024) NOT NULL;
-- CREATE INDEX "knowledge_chunks_embedding_hnsw_idx"
--   ON "rag"."knowledge_chunks"
--   USING hnsw ("embedding" halfvec_cosine_ops);
-- COMMIT;

BEGIN;

CREATE TABLE IF NOT EXISTS "rag"."knowledge_chunks_backup_before_1024"
AS
SELECT *
FROM "rag"."knowledge_chunks";

ALTER TABLE "rag"."knowledge_chunks"
ADD COLUMN IF NOT EXISTS "embedding_v2" halfvec(1024);

COMMIT;

-- Re-embed each row from the current content with the new 1024-dim model, then:
--
--   UPDATE "rag"."knowledge_chunks"
--   SET "embedding_v2" = $1
--   WHERE "id" = $2;

SELECT
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE "embedding_v2" IS NULL) AS rows_missing_v2
FROM "rag"."knowledge_chunks";

SELECT "id", vector_dims("embedding_v2") AS dims
FROM "rag"."knowledge_chunks"
WHERE "embedding_v2" IS NOT NULL
LIMIT 20;

BEGIN;

DROP INDEX IF EXISTS "rag"."knowledge_chunks_embedding_hnsw_idx";

ALTER TABLE "rag"."knowledge_chunks"
DROP COLUMN "embedding";

ALTER TABLE "rag"."knowledge_chunks"
RENAME COLUMN "embedding_v2" TO "embedding";

ALTER TABLE "rag"."knowledge_chunks"
ALTER COLUMN "embedding" SET NOT NULL;

CREATE INDEX "knowledge_chunks_embedding_hnsw_idx"
ON "rag"."knowledge_chunks"
USING hnsw ("embedding" halfvec_cosine_ops);

COMMIT;

SELECT
  format_type(a.atttypid, a.atttypmod) AS embedding_type
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'rag'
  AND c.relname = 'knowledge_chunks'
  AND a.attname = 'embedding'
  AND NOT a.attisdropped;

SELECT vector_dims("embedding") AS dims
FROM "rag"."knowledge_chunks"
LIMIT 20;
