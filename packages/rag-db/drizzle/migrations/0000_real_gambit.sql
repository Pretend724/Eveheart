CREATE SCHEMA "rag";
--> statement-breakpoint
CREATE TYPE "rag"."emotion_category" AS ENUM('general_psychology', 'emotion_management', 'crisis_intervention', 'elder_care', 'therapeutic_dialogue', 'mindfulness', 'grief_support', 'anxiety_relief');--> statement-breakpoint
CREATE TYPE "rag"."risk_level" AS ENUM('general', 'mild', 'moderate', 'crisis');--> statement-breakpoint
CREATE TABLE "rag"."knowledge_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"content" text NOT NULL,
	"chunk_index" integer DEFAULT 0 NOT NULL,
	"target_risk_level" "rag"."risk_level" DEFAULT 'general' NOT NULL,
	"embedding" halfvec(1024) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rag"."knowledge_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" "rag"."emotion_category" NOT NULL,
	"source_type" varchar(50) DEFAULT 'document' NOT NULL,
	"author" varchar(200),
	"user_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rag"."knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "rag"."knowledge_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_chunks_embedding_hnsw_idx" ON "rag"."knowledge_chunks" USING hnsw ("embedding" halfvec_cosine_ops);--> statement-breakpoint
CREATE INDEX "knowledge_chunks_source_id_idx" ON "rag"."knowledge_chunks" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "knowledge_chunks_risk_level_idx" ON "rag"."knowledge_chunks" USING btree ("target_risk_level");
