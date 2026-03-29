import { auth } from "@/lib/auth";
import { prisma } from "@eveheart/db";
import { redirect } from "next/navigation";
import type { UIMessage } from "ai";
import ChatClient from "./chat-client";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const session = await auth();
  if (!session) redirect("/login");

  const chatSession = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  const initialMessages: UIMessage[] = chatSession
    ? chatSession.messages.map((m) => ({
        id: m.id,
        role: m.role as UIMessage["role"],
        parts: m.parts as UIMessage["parts"],
        content: "",
        createdAt: m.createdAt,
      }))
    : [];

  return <ChatClient sessionId={sessionId} initialMessages={initialMessages} />;
}
