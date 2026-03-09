import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // 检查用户认证
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "缺少音频文件" }, { status: 400 });
    }

    // TODO: 调用 speech-service 进行语音识别
    // 这里暂时返回模拟响应
    const response = {
      text: "这是识别的文本内容",
      confidence: 0.95,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("语音识别错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
