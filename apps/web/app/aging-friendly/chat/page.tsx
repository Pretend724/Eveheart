import { auth } from "@/lib/auth";
import { prisma } from "@eveheart/db";
import { redirect } from "next/navigation";
import ChatClient from "@/app/dashboard/chat/[sessionId]/chat-client";
import type { UIMessage } from "ai";

export const dynamic = "force-dynamic";

export default async function AgingFriendlyChatPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // ── Find the most recent chat session, or create one ───────────────────────
  let chatSession = await prisma.chatSession.findFirst({
    where: { userId: session.user.id },
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
        userId: session.user.id,
        title: "适老化对话",
      },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  // ── Convert Prisma messages to AI SDK UIMessage format ─────────────────────
  const initialMessages: UIMessage[] = chatSession.messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: "",
    parts: m.parts as UIMessage["parts"],
    createdAt: m.createdAt,
  }));

  return (
    /*
     * Height calculation:
     *   100svh – 64px (fixed header) – 96px (fixed bottom nav) = remaining viewport
     * We use a fixed height so the chat scrollable area + prompt input work correctly
     * without double scrollbars.
     */
    <div className="flex flex-col h-[calc(100svh-10rem)]">
      <ChatClient sessionId={chatSession.id} initialMessages={initialMessages} />
    </div>
  );
}
