import type { UIMessage } from "ai";
import { prisma } from "@eveheart/db";
import type { ProviderPrefs } from "@/lib/chat/model-resolver";

export async function ensureUserChatSession(
  chatSessionId: string,
  userId: string,
) {
  const chatSession = await prisma.chatSession.upsert({
    where: { id: chatSessionId },
    create: { id: chatSessionId, userId },
    update: {},
  });

  if (chatSession.userId !== userId) {
    return null;
  }

  return chatSession;
}

export async function getUserProviderPrefs(
  userId: string,
): Promise<ProviderPrefs | null> {
  return prisma.userPreferences
    .findUnique({
      where: { userId },
      select: {
        aiProvider: true,
        aiModel: true,
        aiApiKey: true,
        aiBaseUrl: true,
      },
    })
    .catch(() => null);
}

export async function persistChatMessages(
  chatSessionId: string,
  messages: UIMessage[],
) {
  await Promise.all(
    messages.map((message) =>
      prisma.message.upsert({
        where: { id: message.id },
        create: {
          id: message.id,
          chatSessionId,
          role: message.role,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          parts: message.parts as any,
        },
        update: {},
      }),
    ),
  );
}
