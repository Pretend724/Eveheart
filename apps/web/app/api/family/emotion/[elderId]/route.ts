import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthorizedEmotionSnapshot } from "@/lib/server/family-notifications";

export async function GET(
  _request: Request,
  context: { params: Promise<{ elderId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { elderId } = await context.params;
  const snapshot = await getAuthorizedEmotionSnapshot(session.user.id, elderId);

  if (!snapshot) {
    return NextResponse.json({ error: "无权查看该情绪概览" }, { status: 403 });
  }

  return NextResponse.json(snapshot);
}
