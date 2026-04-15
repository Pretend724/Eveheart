import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  NotificationsQuerySchema,
  NotificationsResponseSchema,
} from "@/schemas/family-notifications";
import { isQuietHoursActive } from "@/lib/server/family-notifications";

function normalizePayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  return payload as Record<string, unknown>;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const query = NotificationsQuerySchema.safeParse({
    take: req.nextUrl.searchParams.get("take") ?? undefined,
  });

  if (!query.success) {
    return NextResponse.json({ error: "查询参数无效" }, { status: 400 });
  }

  const [notifications, unreadCount, preferences] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: query.data.take,
      select: {
        id: true,
        title: true,
        summary: true,
        type: true,
        isRead: true,
        relatedEntityType: true,
        relatedEntityId: true,
        createdAt: true,
        readAt: true,
        payload: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    }),
    prisma.notification.count({
      where: {
        recipientId: session.user.id,
        isRead: false,
      },
    }),
    prisma.userPreferences
      .findUnique({
        where: { userId: session.user.id },
        select: {
          elderlyMode: true,
          highContrast: true,
          quietHoursEnabled: true,
          quietHoursStart: true,
          quietHoursEnd: true,
        },
      })
      .catch(() => null),
  ]);

  const resolvedPreferences = {
    elderlyMode: preferences?.elderlyMode ?? false,
    highContrast: preferences?.highContrast ?? false,
    quietHoursEnabled: preferences?.quietHoursEnabled ?? false,
    quietHoursStart: preferences?.quietHoursStart ?? "22:00",
    quietHoursEnd: preferences?.quietHoursEnd ?? "07:00",
  };

  const response = NotificationsResponseSchema.parse({
    notifications: notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      summary: notification.summary,
      type: notification.type,
      isRead: notification.isRead,
      relatedEntityType: notification.relatedEntityType,
      relatedEntityId: notification.relatedEntityId,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt?.toISOString() ?? null,
      sender: notification.sender
        ? {
            id: notification.sender.id,
            name: notification.sender.name,
            email: notification.sender.email,
            image: notification.sender.image,
          }
        : null,
      payload: normalizePayload(notification.payload),
    })),
    unreadCount,
    quietHoursActive: isQuietHoursActive(resolvedPreferences),
    preferences: resolvedPreferences,
  });

  return NextResponse.json(response);
}
