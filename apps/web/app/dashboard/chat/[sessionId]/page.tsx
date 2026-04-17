import { prisma } from "@eveheart/db";
import type { UIMessage } from "ai";
import ChatClient from "./chat-client";
import { getRequiredProxyAuthenticatedUser } from "@/lib/server/proxy-auth";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const user = await getRequiredProxyAuthenticatedUser();

  const chatSession = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  const initialMessages: UIMessage[] = chatSession
    ? chatSession.messages.map((message) => ({
        id: message.id,
        role: message.role as UIMessage["role"],
        parts: message.parts as UIMessage["parts"],
        content: "",
        createdAt: message.createdAt,
      }))
    : [];

  return <ChatClient sessionId={sessionId} initialMessages={initialMessages} />;
}
