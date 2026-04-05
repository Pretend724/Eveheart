import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../drizzle/schema";

// ─── Connection Pool ──────────────────────────────────────────────────────────

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Reasonable defaults for a serverless / edge environment
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// ─── Drizzle Client ───────────────────────────────────────────────────────────

/**
 * Drizzle ORM client connected to the shared PostgreSQL instance.
 * The same DATABASE_URL used by Prisma is reused — both ORMs can
 * operate against the same database as long as their tables are disjoint.
 */
export const db = drizzle(pool, { schema });
