import { prisma } from "@eveheart/db";
import type { UIMessage } from "ai";
import ChatClient from "@/app/dashboard/chat/[sessionId]/chat-client";
import { getRequiredProxyAuthenticatedUser } from "@/lib/server/proxy-auth";

export const dynamic = "force-dynamic";

export default async function AgingFriendlyChatPage() {
  const user = await getRequiredProxyAuthenticatedUser();

  let chatSession = await prisma.chatSession.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 50,
      },
    },
  });

  if (!chatSession) {
    chatSession = await prisma.chatSession.create({
      data: {
        userId: user.id,
        title: "适老化对话",
      },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  const initialMessages: UIMessage[] = chatSession.messages.map((message) => ({
    id: message.id,
    role: message.role as "user" | "assistant",
    content: "",
    parts: message.parts as UIMessage["parts"],
    createdAt: message.createdAt,
  }));

  return (
    <div className="flex h-[calc(100svh-10rem)] flex-col">
      <ChatClient sessionId={chatSession.id} initialMessages={initialMessages} />
    </div>
  );
}
