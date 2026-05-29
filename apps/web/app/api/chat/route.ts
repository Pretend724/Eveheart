import {
  streamText,
  type UIMessage,
  convertToModelMessages,
  createIdGenerator,
} from "ai";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveModel } from "@/lib/chat/model-resolver";
import { buildSystemPrompt } from "@/lib/chat/prompt";
import {
  injectRagIntoMessages,
  retrieveRagContext,
} from "@/lib/chat/rag-context";
import {
  ensureUserChatSession,
  getUserProviderPrefs,
  persistChatMessages,
} from "@/lib/chat/session-store";

type ChatRequestBody = {
  messages: UIMessage[];
  chatSessionId?: string;
};

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { messages, chatSessionId }: ChatRequestBody = await req.json();

    if (!chatSessionId) {
      return NextResponse.json({ error: "缺少会话 ID" }, { status: 400 });
    }

    const chatSession = await ensureUserChatSession(
      chatSessionId,
      session.user.id,
    );

    if (!chatSession) {
      return NextResponse.json({ error: "未授权访问此会话" }, { status: 403 });
    }

    const userPrefs = await getUserProviderPrefs(session.user.id);
    const model = resolveModel(userPrefs);

    let ragContextStr = "";
    try {
      ragContextStr = await retrieveRagContext(messages);
    } catch (ragErr) {
      console.warn("[chat] RAG retrieval skipped:", ragErr);
    }

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
      generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
      onFinish: ({ messages: allMessages }) => {
        persistChatMessages(chatSession.id, allMessages).catch((err) =>
          console.error("消息持久化失败:", err),
        );
      },
    });
  } catch (error) {
    console.error("聊天错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
