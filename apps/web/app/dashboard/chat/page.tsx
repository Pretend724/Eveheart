import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@eveheart/db";

export default async function ChatPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // 查找用户已有的会话（取最早创建的），没有则创建新会话
  let chatSession = await prisma.chatSession.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  if (!chatSession) {
    chatSession = await prisma.chatSession.create({
      data: { userId: session.user.id },
    });
  }

  redirect(`/dashboard/chat/${chatSession.id}`);
}
