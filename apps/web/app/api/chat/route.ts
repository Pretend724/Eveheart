import {
  streamText,
  UIMessage,
  convertToModelMessages,
  createIdGenerator,
  LanguageModel,
} from "ai";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { prisma } from "@eveheart/db";
import { findSimilarChunks } from "@eveheart/rag-db";
import { generateEmbedding } from "@/lib/rag/embedding";
import { buildRagContext } from "@/lib/rag/context";

const PRIMARY_RAG_SIMILARITY = 0.55;
const FALLBACK_RAG_SIMILARITY = 0.3;
const RAG_LIMIT = 5;

// ─── Built-in Provider (fallback) ─────────────────────────────────────────────

const siliconflow = createOpenAICompatible({
  name: "siliconflow",
  apiKey: process.env.SILICONFLOW_API_KEY,
  baseURL: "https://api.siliconflow.cn/v1/",
  includeUsage: true,
});

const BUILTIN_MODEL = "Pro/MiniMaxAI/MiniMax-M2.5";

// ─── External Provider Base URLs ──────────────────────────────────────────────

const PROVIDER_BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1/",
  deepseek: "https://api.deepseek.com/v1/",
};

// ─── Dynamic Model Resolver ───────────────────────────────────────────────────

type ProviderPrefs = {
  aiProvider: string;
  aiModel: string;
  aiApiKey: string | null;
  aiBaseUrl: string | null;
};

/**
 * Creates a LanguageModel instance based on the user's saved preferences.
 * Falls back to the built-in siliconflow MiMo model when:
 *  - the provider is "siliconflow" (or not set)
 *  - an external provider is chosen but the API key is missing
 *  - the custom provider is chosen but the Base URL is missing
 *  - any unexpected error occurs during client construction
 */
function resolveModel(prefs: ProviderPrefs | null): LanguageModel {
  try {
    if (!prefs || prefs.aiProvider === "siliconflow") {
      return siliconflow(prefs?.aiModel ?? BUILTIN_MODEL);
    }

    const { aiProvider, aiModel, aiApiKey, aiBaseUrl } = prefs;
    const apiKey = aiApiKey?.trim();

    // External providers all require an API key
    if (!apiKey) {
      console.warn(
        `[chat] Provider "${aiProvider}" selected but no API key set — falling back to built-in.`,
      );
      return siliconflow(BUILTIN_MODEL);
    }

    // Resolve base URL
    let baseURL: string;
    if (aiProvider === "custom") {
      baseURL = aiBaseUrl?.trim() ?? "";
      if (!baseURL) {
        console.warn(
          "[chat] Custom provider selected but no Base URL set — falling back to built-in.",
        );
        return siliconflow(BUILTIN_MODEL);
      }
      // Ensure the URL ends with a slash for @ai-sdk/openai-compatible
      if (!baseURL.endsWith("/")) baseURL += "/";
    } else {
      baseURL = PROVIDER_BASE_URLS[aiProvider] ?? "";
      if (!baseURL) {
        console.warn(
          `[chat] Unknown provider "${aiProvider}" — falling back to built-in.`,
        );
        return siliconflow(BUILTIN_MODEL);
      }
    }

    const client = createOpenAICompatible({
      name: aiProvider,
      apiKey,
      baseURL,
    });

    return client(aiModel || BUILTIN_MODEL);
  } catch (err) {
    console.error("[chat] Error resolving AI model, using built-in:", err);
    return siliconflow(BUILTIN_MODEL);
  }
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `\
你是 Eveheart，一位遵循人本主义理念的情感陪护 AI。你以"来访者中心"为核心，提供非指导性的心理陪伴服务。

## 身份与定位
- 你是情感陪伴者，不是心理治疗师，不做任何诊断或治疗
- 你的目标是让用户感到被听见、被理解、被接纳
- 保持边界：不替用户做决定，不主动给出具体建议，除非用户明确要求

## 核心准则

**无条件积极关注**
无论用户表达何种情绪或想法，都给予尊重与接纳，不做道德或价值评判。

**共情式理解**
站在用户的视角，准确感知其情绪与内心体验，并通过语言反馈给用户。
例如："我能感受到你此刻的委屈和无力。"

**真诚一致**
以真实、温和的态度回应，避免虚伪或表演式的安慰，让用户感受到安全与信任。

**非指导性陪伴**
不主动提供解决方案，不替用户做选择，而是通过开放式提问帮助用户自我探索与觉察，找到内在力量。

## 语言风格
- 简洁、温暖、有力量，避免冗长句式
- 每次回应聚焦一个点，不要一次性抛出多个问题
- 多用："我听到了……""听起来你……""你愿意多说说吗？""这对你来说一定很不容易。"
- 避免："你应该……""你必须……""别难过了""想开点""其实没那么糟"

## 危机处理
若用户出现自伤、自杀或伤人倾向，立即执行以下步骤：
1. 温和表达关心："我很担心你现在的状态，你的安全对我非常重要。"
2. 提供专业援助信息：
   - 全国心理援助热线：400-161-9995
   - 北京心理危机研究与干预中心：010-82951332
   - 生命热线：400-821-1215
3. 保持陪伴姿态，避免说教或指责
4. 明确说明专业帮助的必要性，不独自承担危机处理责任

## 保密原则
对话内容仅用于本次陪伴服务，不会被泄露或用于其他目的。\
`;

// ─── Route Handler ────────────────────────────────────────────────────────────

function extractLatestUserText(messages: UIMessage[]): string {
  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  if (!lastUserMessage) return "";

  return (
    lastUserMessage.parts
      ?.filter(
        (part): part is { type: "text"; text: string } => part.type === "text",
      )
      .map((part) => part.text)
      .join(" ")
      .trim() ?? ""
  );
}

async function retrieveRagContext(messages: UIMessage[]): Promise<string> {
  const textContent = extractLatestUserText(messages);
  if (!textContent) return "";

  const queryEmbedding = await generateEmbedding(textContent);
  if (!queryEmbedding) return "";

  let chunks = await findSimilarChunks(queryEmbedding, {
    limit: RAG_LIMIT,
    minSimilarity: PRIMARY_RAG_SIMILARITY,
  });

  if (chunks.length === 0) {
    chunks = await findSimilarChunks(queryEmbedding, {
      limit: RAG_LIMIT,
      minSimilarity: FALLBACK_RAG_SIMILARITY,
    });
  }

  if (chunks.length === 0) return "";

  console.info(
    "[chat] RAG matched chunks:",
    chunks.map((chunk) => ({
      id: chunk.id,
      sourceTitle: chunk.sourceTitle,
      similarity: Number(chunk.similarity.toFixed(3)),
    })),
  );

  return buildRagContext(chunks);
}

function buildSystemPrompt(ragContext: string): string {
  if (!ragContext) return SYSTEM_PROMPT;

  return [
    SYSTEM_PROMPT,
    "",
    "当提供了专业知识参考（RAG）时，请优先依据这些知识回答当前问题。",
    "如果用户问题和检索出的知识相关，你的回答必须体现这些知识点，而不是只给泛化建议。",
    "",
    ragContext,
  ].join("\n");
}

function injectRagIntoMessages(
  messages: UIMessage[],
  ragContext: string,
): UIMessage[] {
  if (!ragContext) return messages;

  const lastUserMessageIndex = [...messages]
    .map((message, index) => ({ message, index }))
    .reverse()
    .find(({ message }) => message.role === "user")?.index;

  if (lastUserMessageIndex === undefined) return messages;

  const nextMessages = structuredClone(messages);
  const targetMessage = nextMessages[lastUserMessageIndex];

  const lastTextPartIndex = [...targetMessage.parts]
    .map((part, index) => ({ part, index }))
    .reverse()
    .find(({ part }) => part.type === "text")?.index;

  if (lastTextPartIndex === undefined) return messages;

  const textPart = targetMessage.parts[lastTextPartIndex];
  if (textPart.type !== "text") return messages;

  targetMessage.parts[lastTextPartIndex] = {
    ...textPart,
    text: [
      "请结合下面提供的知识库内容，优先根据知识库回答我的问题。",
      "如果知识库中已经包含答案，就直接使用这些内容，不要泛泛而谈。",
      "",
      ragContext,
      "",
      "我的问题是：",
      textPart.text,
    ].join("\n"),
  };

  return nextMessages;
}

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // ── Parse request ────────────────────────────────────────────────────────
    const {
      messages,
      chatSessionId,
    }: { messages: UIMessage[]; chatSessionId?: string } = await req.json();

    if (!chatSessionId) {
      return NextResponse.json({ error: "缺少会话 ID" }, { status: 400 });
    }

    // ── Validate / create ChatSession ────────────────────────────────────────
    const chatSession = await prisma.chatSession.upsert({
      where: { id: chatSessionId },
      create: { id: chatSessionId, userId: session.user.id },
      update: {},
    });

    if (chatSession.userId !== session.user.id) {
      return NextResponse.json({ error: "未授权访问此会话" }, { status: 403 });
    }

    // ── Load user preferences (non-blocking fallback) ─────────────────────────
    // Uses .catch(() => null) so a missing table (pre-migration) never breaks chat.
    const userPrefs = await prisma.userPreferences
      .findUnique({
        where: { userId: session.user.id },
        select: {
          aiProvider: true,
          aiModel: true,
          aiApiKey: true,
          aiBaseUrl: true,
        },
      })
      .catch(() => null);

    // ── Resolve the model dynamically ─────────────────────────────────────────
    const model = resolveModel(userPrefs);

    // ── RAG: retrieve relevant knowledge context ────────────────────────────
    // Embed the latest user message and fetch semantically similar knowledge chunks.
    // Failures are silently swallowed so RAG unavailability never breaks chat.
    let ragContextStr = "";
    try {
      ragContextStr = await retrieveRagContext(messages);
    } catch (ragErr) {
      // RAG is enhancement-only; log but never block the main chat flow
      console.warn("[chat] RAG retrieval skipped:", ragErr);
    }

    const currentSessionId = chatSession.id;

    // ── Stream ───────────────────────────────────────────────────────────────
    const modelMessages = await convertToModelMessages(
      injectRagIntoMessages(messages, ragContextStr),
    );

    const result = streamText({
      model,
      system: buildSystemPrompt(ragContextStr),
      messages: modelMessages,
      onError({ error }) {
        console.error("Chat API error:", error);
      },
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      // Server-generated IDs ensure persistence idempotency
      generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
      onFinish: ({ messages: allMessages }) => {
        // Non-blocking write; upsert is idempotent on duplicate requests
        Promise.all(
          allMessages.map((m) =>
            prisma.message.upsert({
              where: { id: m.id },
              create: {
                id: m.id,
                chatSessionId: currentSessionId,
                role: m.role,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                parts: m.parts as any,
              },
              update: {},
            }),
          ),
        ).catch((err) => console.error("消息持久化失败:", err));
      },
    });
  } catch (error) {
    console.error("聊天错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
