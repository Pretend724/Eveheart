<p align="center">
  <img src="apps/web/public/logo.svg" width="64" height="64" alt="Eveheart 标志" />
</p>

<h1 align="center">Eveheart</h1>

<p align="center">
  基于 Next.js、Prisma、Drizzle、pgvector 和 AI SDK 构建的 AI 情感陪伴 Web 应用。
</p>

Eveheart 是一个面向情绪陪伴场景的 AI Web 应用。它提供登录注册、仪表盘、流式聊天、个人偏好、知识库 RAG、账户隐私设置，以及适老化界面等功能。

## 功能亮点

- Next.js 16 App Router + React 19 + TypeScript
- Tailwind CSS + shadcn/ui 风格组件
- NextAuth v5 Credentials 登录，Prisma 适配用户、会话和聊天数据
- AI SDK 流式对话，支持内置 SiliconFlow 以及 OpenAI-compatible 自定义模型
- 用户知识库 RAG：文本切块、1024 维 embedding、PostgreSQL + pgvector 检索
- 偏好设置：模型提供商、人格名称、回复语言、语音、字号、适老化与提醒
- 账户与隐私：修改账号信息、导出聊天记录、清空历史、保留策略、删除账户
- LiveKit 语音代理相关页面和服务骨架，主要用于后续语音/数字人能力集成

## 技术栈

| 模块 | 技术 |
| --- | --- |
| Web 应用 | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Radix UI, lucide-react |
| 认证 | NextAuth v5 beta, Credentials provider, JWT session |
| 核心数据库 | PostgreSQL, Prisma |
| RAG 数据库 | PostgreSQL, pgvector, Drizzle ORM |
| AI | AI SDK, `@ai-sdk/react`, OpenAI-compatible providers |
| 语音/Agent 实验 | LiveKit, Python agent service |
| 工作区 | pnpm monorepo, Turborepo |

## 仓库结构

```text
apps/
  web/                 Next.js App Router 应用

packages/
  db/                  Prisma schema、client 和核心业务表迁移
  rag-db/              Drizzle schema、迁移和 RAG 检索工具

services/
  ai/                  多模态AI
  agent/               LiveKit/FunASR agent 

documents/             知识库测试文档
docker/                Dockerfile 与 compose 配置
```

## 架构说明

Eveheart 有意在同一个 PostgreSQL 数据库上使用两套 ORM：

- `packages/db` 通过 Prisma 管理默认的 `public` schema 中的核心业务表。
- `packages/rag-db` 通过 Drizzle 只管理 `rag` schema。
- Drizzle 已配置 `schemaFilter: ["rag"]`，并把迁移记录表放在独立的 `drizzle` schema 中。

修改数据库代码时请保持这条边界。不要让 Drizzle diff Prisma 管理的表，也不要在没有明确计划的情况下把 Prisma 表迁到 Drizzle。

## 快速开始

### 前置要求

- 与 Next.js 16 兼容的 Node.js 版本
- pnpm 10
- PostgreSQL
- 使用 RAG 知识库时需要启用 pgvector 扩展

### 安装依赖

```bash
pnpm install
```

### 环境变量

在仓库根目录创建 `.env` 文件：

```bash
cp .env.example .env
```

常用变量：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/eveheart"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

SILICONFLOW_API_KEY="your-siliconflow-key"
EMBEDDING_MODEL="your-1024-dimension-embedding-model"

# 可选覆盖项
EMBEDDING_API_KEY="your-embedding-key"
EMBEDDING_BASE_URL="https://api.siliconflow.cn/v1/"
LIVEKIT_URL="..."
LIVEKIT_API_KEY="..."
LIVEKIT_API_SECRET="..."
```

### 数据库

生成并应用 Prisma schema：

```bash
pnpm --filter @eveheart/db db:generate
pnpm --filter @eveheart/db db:push
```

应用 Drizzle 管理的 RAG schema：

```bash
pnpm --filter @eveheart/rag-db db:push
```

如果使用迁移流程：

```bash
pnpm --filter @eveheart/db db:migrate
pnpm --filter @eveheart/rag-db db:migrate
```

### 启动开发服务

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 常用命令

```bash
pnpm dev
pnpm build
pnpm lint
pnpm start
```

包级命令：

```bash
pnpm --filter @eveheart/web check-type
pnpm --filter @eveheart/db db:studio
pnpm --filter @eveheart/rag-db db:studio
```

## 主要流程

### 认证

用户通过 `POST /api/auth/register` 注册，并通过 NextAuth Credentials 登录。JWT session 会扩展 `user.id`，供仪表盘、聊天、知识库和设置相关功能使用。

关键文件：

- `apps/web/lib/auth.ts`
- `apps/web/auth.config.ts`
- `apps/web/app/api/auth/register/route.ts`

### 聊天

仪表盘聊天页会查找或创建 `ChatSession`，跳转到 `/dashboard/chat/[sessionId]`，通过 `/api/chat` 流式返回模型输出，并使用 Prisma 持久化消息。

关键文件：

- `apps/web/app/dashboard/chat/page.tsx`
- `apps/web/app/dashboard/chat/[sessionId]/chat-client.tsx`
- `apps/web/app/api/chat/route.ts`

### 知识库 / RAG

知识源会被切块、生成 embedding，并存入 `rag.knowledge_chunks`。聊天时系统会基于 cosine similarity 检索相关内容。当前向量列为 `halfvec(1024)`，并使用 HNSW 索引。

关键文件：

- `apps/web/lib/actions/knowledge.ts`
- `apps/web/lib/rag/embedding.ts`
- `apps/web/lib/rag/context.ts`
- `packages/rag-db/drizzle/schema/knowledge.ts`
- `packages/rag-db/lib/retrieval.ts`

### 偏好设置

用户偏好控制 AI provider/model、自定义 API key、人格名称、回复语言、语音设置、无障碍选项和提醒设置。

关键文件：

- `apps/web/app/dashboard/setting/preferences-setting/preferences-client.tsx`
- `apps/web/lib/actions/preferences.ts`
- `packages/db/prisma/schema.prisma`

## Docker

`docker/` 目录包含 PostgreSQL、Web 和 agent 服务的 Dockerfile 与 compose 配置：

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

> [!WARNING]
> 当前 compose 文件使用标准 `postgres:16` 镜像。RAG 功能依赖 pgvector，请改用带 pgvector 的数据库镜像，或在应用 RAG schema 前手动安装并启用扩展。


