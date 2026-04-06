import * as dotenv from "dotenv";
import * as path from "path";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const RAG_SCHEMA = "rag";
const DRIZZLE_META_SCHEMA = "drizzle";
const DRIZZLE_MIGRATIONS_TABLE = "__drizzle_migrations_rag";

export default defineConfig({
  schema: "./drizzle/schema",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Only manage Drizzle-owned objects inside the dedicated `rag` schema.
  // This keeps existing Prisma tables in `public` completely out of scope.
  schemaFilter: [RAG_SCHEMA],
  migrations: {
    schema: DRIZZLE_META_SCHEMA,
    table: DRIZZLE_MIGRATIONS_TABLE,
  },
  // Require confirmation before any `push` applies SQL to the database.
  strict: true,
});
