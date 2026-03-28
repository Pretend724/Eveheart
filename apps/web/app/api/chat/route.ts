import { streamText, UIMessage, convertToModelMessages, tool } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ChatMessageSchema } from "@/schemas/chat";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";

const siliconflow = createOpenAICompatible({
  name: "siliconflow",
  apiKey: process.env.SILICONFLOW_API_KEY,
  baseURL: "https://api.siliconflow.cn/v1/",
  includeUsage: true,
});
const xiaomi = createOpenAICompatible({
  name: "xiaomi",
  apiKey: process.env.MIMO_API_KEY,
  baseURL: "https://api.xiaomimimo.com/v1/",
  includeUsage: true,
});

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // 检查用户认证
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { messages }: { messages: UIMessage[] } = await req.json();

    // const result = streamText({
    //   model: provider("Qwen/Qwen3.5-397B-A17B"),
    //   messages: await convertToModelMessages(messages),
    // });
    const result = streamText({
      // model: groq("openai/gpt-oss-120b"),
      model: xiaomi("mimo-v2-flash"),
      messages: await convertToModelMessages(messages),
      onError({ error }) {
        console.error("Chat API error:", error);
      },
    });
    // const body = await req.json();
    // const validation = ChatMessageSchema.safeParse(body);

    // if (!validation.success) {
    //   return NextResponse.json(
    //     { error: "验证失败", details: validation.error.issues },
    //     { status: 400 },
    //   );
    // }

    // const { message, emotion, history } = validation.data;

    // // TODO: 调用 agent-service 进行 AI 对话处理
    // // 这里暂时返回模拟响应
    // const response = {
    //   role: "assistant",
    //   content: "您好，我理解您的感受。作为您的陪伴助手，我会一直倾听您的心声。",
    //   emotion: emotion || "中性",
    // };

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("聊天错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
