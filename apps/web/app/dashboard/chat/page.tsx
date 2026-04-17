import { redirect } from "next/navigation";
import { prisma } from "@eveheart/db";
import { getRequiredProxyAuthenticatedUser } from "@/lib/server/proxy-auth";

export default async function ChatPage() {
  const user = await getRequiredProxyAuthenticatedUser();

  let chatSession = await prisma.chatSession.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  if (!chatSession) {
    chatSession = await prisma.chatSession.create({
      data: { userId: user.id },
    });
  }

  redirect(`/dashboard/chat/${chatSession.id}`);
}
