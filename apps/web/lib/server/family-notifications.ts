import "server-only";

import { prisma } from "@/lib/prisma";
import { EmotionSnapshotSchema } from "@/schemas/family-notifications";

type NotificationPreferences = {
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
};

function parseClockTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

export function isQuietHoursActive(
  preferences: NotificationPreferences,
  now = new Date(),
) {
  if (!preferences.quietHoursEnabled) {
    return false;
  }

  const start = parseClockTime(preferences.quietHoursStart);
  const end = parseClockTime(preferences.quietHoursEnd);
  if (start === null || end === null) {
    return false;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (start === end) {
    return true;
  }

  if (start < end) {
    return currentMinutes >= start && currentMinutes < end;
  }

  return currentMinutes >= start || currentMinutes < end;
}

export async function canViewElderEmotion(viewerId: string, elderId: string) {
  if (viewerId === elderId) {
    return true;
  }

  const relationship = await prisma.familyRelationship.findFirst({
    where: {
      elderId,
      familyMemberId: viewerId,
      status: "ACCEPTED",
    },
    select: { id: true },
  });

  return Boolean(relationship);
}

export async function getEmotionSnapshotForUser(elderId: string) {
  const elder = await prisma.user.findUnique({
    where: { id: elderId },
    select: {
      id: true,
      name: true,
      email: true,
      chats: {
        select: {
          emotionLogs: {
            orderBy: { createdAt: "desc" },
            take: 12,
            select: {
              emotion: true,
              score: true,
              source: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!elder) {
    return null;
  }

  const logs = elder.chats.flatMap((chat) => chat.emotionLogs).sort((a, b) => {
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const latest = logs[0] ?? null;
  const totalLogs = logs.length;
  const averageScore =
    totalLogs > 0
      ? Number((logs.reduce((sum, log) => sum + log.score, 0) / totalLogs).toFixed(3))
      : null;

  const emotionBuckets = new Map<string, { count: number; scoreTotal: number }>();
  for (const log of logs) {
    const bucket = emotionBuckets.get(log.emotion) ?? { count: 0, scoreTotal: 0 };
    bucket.count += 1;
    bucket.scoreTotal += log.score;
    emotionBuckets.set(log.emotion, bucket);
  }

  let dominantEmotion: string | null = null;
  let dominantWeight = -1;
  for (const [emotion, bucket] of emotionBuckets.entries()) {
    const weight = bucket.scoreTotal / bucket.count;
    if (weight > dominantWeight) {
      dominantEmotion = emotion;
      dominantWeight = weight;
    }
  }

  return EmotionSnapshotSchema.parse({
    elderId: elder.id,
    elderName: elder.name ?? elder.email,
    latestEmotion: latest?.emotion ?? null,
    latestScore: latest ? Number(latest.score.toFixed(3)) : null,
    latestSource: latest?.source ?? null,
    latestLoggedAt: latest?.createdAt.toISOString() ?? null,
    totalLogs,
    dominantEmotion,
    averageScore,
    recentEntries: logs.slice(0, 5).map((log) => ({
      emotion: log.emotion,
      score: Number(log.score.toFixed(3)),
      source: log.source,
      createdAt: log.createdAt.toISOString(),
    })),
  });
}

export async function getAuthorizedEmotionSnapshot(
  viewerId: string,
  elderId: string,
) {
  const allowed = await canViewElderEmotion(viewerId, elderId);
  if (!allowed) {
    return null;
  }

  return getEmotionSnapshotForUser(elderId);
}
