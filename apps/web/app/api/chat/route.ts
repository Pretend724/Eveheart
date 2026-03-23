import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ChatMessageSchema } from "@/schemas/chat";

export async function POST(req: NextRequest) {
  try {
    // 检查用户认证
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await req.json();
    const validation = ChatMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "验证失败", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { message, emotion, history } = validation.data;

    // TODO: 调用 agent-service 进行 AI 对话处理
    // 这里暂时返回模拟响应
    const response = {
      role: "assistant",
      content: "您好，我理解您的感受。作为您的陪伴助手，我会一直倾听您的心声。",
      emotion: emotion || "中性",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("聊天错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
