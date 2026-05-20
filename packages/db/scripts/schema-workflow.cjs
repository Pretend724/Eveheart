const { spawnSync } = require("child_process");
const path = require("path");

const dotenv = require("dotenv");
const { Client } = require("pg");

const repoRoot = path.resolve(__dirname, "../../..");
dotenv.config({ path: path.join(repoRoot, ".env") });

const mode = process.argv[2] || "deploy";
const pnpm = "pnpm";

function run(label, args) {
  const result = spawnSync(pnpm, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: true,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 1}`);
  }
}

async function ensureVectorExtension() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to prepare the database.");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS vector;");
  } finally {
    await client.end();
  }
}

function generateAll() {
  run("Prisma generate", ["--filter", "@eveheart/db", "db:generate"]);
  run("Drizzle generate", ["--filter", "@eveheart/rag-db", "db:generate"]);
}

async function pushAll() {
  await ensureVectorExtension();
  run("Prisma db push", ["--filter", "@eveheart/db", "db:push"]);
  run("Drizzle push", [
    "--filter",
    "@eveheart/rag-db",
    "exec",
    "drizzle-kit",
    "push",
    "--force",
  ]);
}

async function main() {
  if (mode === "generate") {
    generateAll();
    return;
  }

  if (mode === "push") {
    await pushAll();
    return;
  }

  if (mode === "deploy") {
    generateAll();
    await pushAll();
    return;
  }

  throw new Error(`Unknown database workflow mode: ${mode}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
