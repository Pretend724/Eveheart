# Eveheart Agent Guide

This file is the repository-level context for coding agents working in this
workspace. Prefer the current source code over older planning documents when
they disagree.

## Project Summary

Eveheart is a `pnpm` monorepo for an AI emotional companion web app.

Current production-facing stack:

- `apps/web`: Next.js 16 App Router application
- `packages/db`: Prisma data layer for core business tables in PostgreSQL
- `packages/rag-db`: Drizzle data layer for RAG tables in the `rag` schema

There is also a Python directory under `services/ai`, but it is not wired into
the main Next.js runtime flow today. Treat it as adjacent research/service code,
not as a guaranteed live dependency of the web app.

## Monorepo Layout

```text
apps/
  web/              Main Next.js app

packages/
  db/               Prisma client + schema + migrations
  rag-db/           Drizzle schema + retrieval API + migrations

services/
  ai/               Python AI experiments / service assets

documents/
  Architecture.md
  Dev_Specifications.md
  AI_DEV_PROMPT.md
```

## Source of Truth

When documentation conflicts:

1. Trust the code in `apps/web`, `packages/db`, and `packages/rag-db`.
2. Trust current package manifests and ORM schemas.
3. Treat `documents/` as helpful context, but some parts are aspirational or
   outdated.

In particular:

- The app uses Prisma and Drizzle side-by-side.
- The RAG stack is implemented directly with AI SDK embeddings and Drizzle.
- The Python service directory is not the primary backend for the web app.

## Core Architecture

### Web App

The main app is in `apps/web` and uses:

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- NextAuth v5 beta
- AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/openai-compatible`)

Important entry points:

- `apps/web/app/layout.tsx`
- `apps/web/app/dashboard/layout.tsx`
- `apps/web/lib/auth.ts`
- `apps/web/app/api/chat/route.ts`

### Primary Database Layer

`packages/db` owns the core business schema via Prisma.

Important models:

- `User`
- `Account`
- `Session`
- `VerificationToken`
- `ChatSession`
- `Message`
- `UserPreferences`
- `EmotionLog`

Source of truth:

- `packages/db/prisma/schema.prisma`

### RAG Database Layer

`packages/rag-db` owns knowledge-base storage via Drizzle.

Important objects:

- `rag.knowledge_sources`
- `rag.knowledge_chunks`
- `rag.emotion_category`
- `rag.risk_level`

Current vector setup:

- PostgreSQL + pgvector
- `halfvec(1024)`
- HNSW index with `halfvec_cosine_ops`

Source of truth:

- `packages/rag-db/drizzle/schema/knowledge.ts`
- `packages/rag-db/lib/retrieval.ts`
- `packages/rag-db/drizzle.config.ts`

## Critical ORM Boundary

This repository intentionally runs Prisma and Drizzle against the same database.

Rules:

- Prisma manages core tables in the default/public schema.
- Drizzle manages only the `rag` schema.
- Do not let Drizzle diff or manage Prisma-owned tables.
- Do not move Prisma tables into Drizzle unless explicitly requested.

Drizzle is already isolated with:

- `schemaFilter: ["rag"]`
- dedicated Drizzle migrations table in schema `drizzle`

Check:

- `packages/rag-db/drizzle.config.ts`

## Main Product Flows

### 1. Authentication

- Registration exists as both API route and server action.
- Login uses NextAuth Credentials provider.
- Session JWT is extended with `user.id`.

Key files:

- `apps/web/lib/auth.ts`
- `apps/web/auth.config.ts`
- `apps/web/types/next-auth.d.ts`
- `apps/web/app/api/auth/register/route.ts`

### 2. Chat

Chat flow:

1. User visits `/dashboard/chat`
2. App finds or creates a `ChatSession`
3. UI redirects to `/dashboard/chat/[sessionId]`
4. Client uses `useChat` to call `/api/chat`
5. Route resolves model from `UserPreferences`
6. Route may run RAG retrieval
7. Response streams back via AI SDK
8. Messages are persisted into Prisma `Message`

Key files:

- `apps/web/app/dashboard/chat/page.tsx`
- `apps/web/app/dashboard/chat/[sessionId]/page.tsx`
- `apps/web/app/dashboard/chat/[sessionId]/chat-client.tsx`
- `apps/web/app/api/chat/route.ts`

### 3. Knowledge Base / RAG

Knowledge flow:

1. User creates a knowledge source
2. Content is chunked
3. Embeddings are generated
4. Chunks are inserted into `rag.knowledge_chunks`
5. Query-time embedding is generated from the latest user message
6. Similar chunks are retrieved with cosine similarity

Key files:

- `apps/web/lib/actions/knowledge.ts`
- `apps/web/lib/rag/embedding.ts`
- `apps/web/lib/rag/context.ts`
- `packages/rag-db/lib/retrieval.ts`
- `packages/rag-db/drizzle/schema/knowledge.ts`

### 4. Preferences

User preferences include:

- AI provider
- AI model
- API key
- base URL
- persona name
- reply language
- voice/display/accessibility settings
- reminder settings

Key files:

- `apps/web/app/dashboard/setting/preferences-setting/preferences-client.tsx`
- `apps/web/lib/actions/preferences.ts`
- `packages/db/prisma/schema.prisma`

### 5. Account & Privacy

Current account actions:

- update username
- update password
- clear conversation history
- update retention policy
- export chat history as markdown
- delete account

Key files:

- `apps/web/lib/actions/account-setting.ts`
- `apps/web/app/dashboard/setting/account-setting/page.tsx`

## Important Current Limitations

These parts are incomplete or placeholder-heavy:

- `apps/web/app/api/emotion/route.ts` is mock logic
- `apps/web/app/api/speech/asr/route.ts` is mock logic
- `apps/web/components/dashboard/digital-human.tsx` is placeholder UI
- `apps/web/app/dashboard/chat/AI-avatar/page.tsx` is placeholder content

Also note:

- `EmotionLog` is modeled and read by conversation APIs, but the write-side
  pipeline is not fully established in the current app flow.
- `/api/chat` computes RAG context, but verify whether it is actually injected
  into the model prompt before assuming full RAG behavior. This area is easy to
  regress.

## Environment Variables

The real app expects more than `.env.example` currently documents.

Commonly required variables:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `SILICONFLOW_API_KEY`
- `EMBEDDING_MODEL`

Optional or provider-specific:

- `EMBEDDING_API_KEY`
- `EMBEDDING_BASE_URL`

Notes:

- Prisma and Drizzle both read the same root `DATABASE_URL`.
- Embedding code falls back to `SILICONFLOW_API_KEY` when
  `EMBEDDING_API_KEY` is not set.

## Commands

From repo root:

```bash
pnpm dev
pnpm build
pnpm lint
```

Prisma package:

```bash
pnpm --filter @eveheart/db db:generate
pnpm --filter @eveheart/db db:push
pnpm --filter @eveheart/db db:migrate
```

Drizzle package:

```bash
pnpm --filter @eveheart/rag-db db:generate
pnpm --filter @eveheart/rag-db db:push
pnpm --filter @eveheart/rag-db db:migrate
```

## Coding Guidelines For Agents

- Prefer small, targeted edits over broad rewrites.
- Preserve the Prisma/Drizzle ownership boundary.
- Keep embedding dimension, DB schema, and retrieval validation in sync.
- Treat placeholder modules as incomplete unless you verify otherwise.
- When changing chat behavior, verify both streaming and persistence logic.
- When changing preferences, verify `/api/chat` still resolves models correctly.
- When changing RAG, inspect:
  - embedding generation
  - vector column type
  - retrieval dimension checks
  - prompt injection path

## File Areas Worth Reading First

- `apps/web/lib/auth.ts`
- `apps/web/app/api/chat/route.ts`
- `apps/web/lib/rag/embedding.ts`
- `apps/web/lib/rag/context.ts`
- `apps/web/lib/actions/knowledge.ts`
- `packages/db/prisma/schema.prisma`
- `packages/rag-db/drizzle/schema/knowledge.ts`
- `packages/rag-db/lib/retrieval.ts`

## Out-of-Scope Assumptions To Avoid

Do not assume the following are already production-ready:

- speech recognition
- emotion recognition
- digital human/avatar rendering
- Python AI service integration

Validate from code before making those claims or building on them.

## LiveKit Agent Best Practices 

- Begin with a starter project. The Python and Node.js starters include working agents, tests, and an optimized AGENTS.md.
- Read the docs like a human: browse the table of contents first (lk docs overview), search docs second (lk docs search), and search code third (lk docs code-search). Browsing gives full context — search only gives fragments.
- Always check the docs before writing LiveKit code. The APIs change frequently and training data goes stale.
- Use code search to answer detailed questions about a class or method that isn't present in the docs.
- If the docs don't match the package installed or something breaks after an upgrade, check the changelog (lk docs changelog).
- Search results only show excerpts — always fetch the full page with lk docs get-page to see prerequisites and related options.
- Practice TDD with the agents testing framework in the Python and Node.js Agents SDKs. The testing guide also has advice on CI setup.
