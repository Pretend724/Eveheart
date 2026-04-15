"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  FamilyActionResultSchema,
  InviteFamilyMemberInputSchema,
  type FamilyActionResult,
  MarkNotificationReadInputSchema,
  RemoveFamilyRelationshipInputSchema,
  RespondToFamilyInviteInputSchema,
  SendEmotionUpdateNotificationInputSchema,
  SendFamilyMessageInputSchema,
} from "@/schemas/family-notifications";
import { getEmotionSnapshotForUser } from "@/lib/server/family-notifications";

function formatValidationError(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}) {
  const fieldErrors = error.flatten().fieldErrors;
  const firstMessage =
    Object.values(fieldErrors).flat().find(Boolean) ?? "提交的数据无效，请检查后重试。";

  return FamilyActionResultSchema.parse({
    success: false,
    message: firstMessage,
    fieldErrors,
  });
}

function success(message: string): FamilyActionResult {
  return FamilyActionResultSchema.parse({
    success: true,
    message,
  });
}

function failure(message: string): FamilyActionResult {
  return FamilyActionResultSchema.parse({
    success: false,
    message,
  });
}

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  return session.user;
}

function revalidateFamilyUi() {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/setting/account-setting");
}

export async function inviteFamilyMemberAction(input: unknown) {
  const user = await requireUser();
  if (!user) {
    return failure("请先登录后再发送绑定邀请。");
  }

  const parsed = InviteFamilyMemberInputSchema.safeParse(input);
  if (!parsed.success) {
    return formatValidationError(parsed.error);
  }

  const query = parsed.data.query.trim();

  const inviter = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true },
  });

  if (!inviter) {
    return failure("当前账号不存在或已失效。");
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id: { not: user.id },
      OR: [
        { email: { equals: query, mode: "insensitive" } },
        { name: { equals: query, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true },
  });

  if (!targetUser) {
    return failure("没有找到对应的家属账号，请确认用户名或邮箱是否正确。");
  }

  const existingRelationship = await prisma.familyRelationship.findUnique({
    where: {
      elderId_familyMemberId: {
        elderId: user.id,
        familyMemberId: targetUser.id,
      },
    },
    select: { id: true, status: true },
  });

  if (existingRelationship?.status === "ACCEPTED") {
    return failure("该家属已经与您绑定，无需重复邀请。");
  }

  const relationship = existingRelationship
    ? await prisma.familyRelationship.update({
        where: { id: existingRelationship.id },
        data: {
          status: "PENDING",
          confirmedAt: null,
        },
      })
    : await prisma.familyRelationship.create({
        data: {
          elderId: user.id,
          familyMemberId: targetUser.id,
          status: "PENDING",
          confirmedAt: null,
        },
      });

  await prisma.notification.create({
    data: {
      recipientId: targetUser.id,
      senderId: user.id,
      type: "FAMILY_INVITE",
      title: "新的家属绑定邀请",
      summary: `${inviter.name ?? inviter.email} 希望与您建立亲属绑定关系。`,
      relatedEntityType: "familyRelationship",
      relatedEntityId: relationship.id,
      payload: {
        relationshipId: relationship.id,
        elderId: inviter.id,
        elderName: inviter.name ?? inviter.email,
        familyMemberId: targetUser.id,
      },
    },
  });

  revalidateFamilyUi();
  return success(`已向 ${targetUser.name ?? targetUser.email} 发送绑定邀请。`);
}

export async function respondToFamilyInviteAction(input: unknown) {
  const user = await requireUser();
  if (!user) {
    return failure("请先登录后再处理邀请。");
  }

  const parsed = RespondToFamilyInviteInputSchema.safeParse(input);
  if (!parsed.success) {
    return formatValidationError(parsed.error);
  }

  const relationship = await prisma.familyRelationship.findFirst({
    where: {
      id: parsed.data.relationshipId,
      familyMemberId: user.id,
    },
    include: {
      elder: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!relationship) {
    return failure("未找到可处理的邀请记录。");
  }

  if (relationship.status === "ACCEPTED" && parsed.data.decision === "accept") {
    return failure("这条邀请已经接受，无需重复操作。");
  }

  const accepted = parsed.data.decision === "accept";

  await prisma.familyRelationship.update({
    where: { id: relationship.id },
    data: {
      status: accepted ? "ACCEPTED" : "REJECTED",
      confirmedAt: accepted ? new Date() : null,
    },
  });

  await prisma.notification.create({
    data: {
      recipientId: relationship.elderId,
      senderId: user.id,
      type: accepted ? "FAMILY_INVITE_ACCEPTED" : "FAMILY_INVITE_REJECTED",
      title: accepted ? "家属邀请已接受" : "家属邀请被婉拒",
      summary: accepted
        ? `${user.name ?? user.email ?? "家属"} 已接受您的绑定邀请。`
        : `${user.name ?? user.email ?? "家属"} 暂未接受您的绑定邀请。`,
      relatedEntityType: "familyRelationship",
      relatedEntityId: relationship.id,
      payload: {
        relationshipId: relationship.id,
        elderId: relationship.elder.id,
        elderName: relationship.elder.name ?? relationship.elder.email,
      },
    },
  });

  revalidateFamilyUi();
  return success(accepted ? "已接受邀请。" : "已拒绝邀请。");
}

export async function removeFamilyRelationshipAction(input: unknown) {
  const user = await requireUser();
  if (!user) {
    return failure("请先登录后再操作。");
  }

  const parsed = RemoveFamilyRelationshipInputSchema.safeParse(input);
  if (!parsed.success) {
    return formatValidationError(parsed.error);
  }

  const relationship = await prisma.familyRelationship.findFirst({
    where: {
      id: parsed.data.relationshipId,
      OR: [{ elderId: user.id }, { familyMemberId: user.id }],
    },
    include: {
      elder: { select: { id: true, name: true, email: true } },
      familyMember: { select: { id: true, name: true, email: true } },
    },
  });

  if (!relationship) {
    return failure("未找到可解绑的关系记录。");
  }

  await prisma.familyRelationship.delete({
    where: { id: relationship.id },
  });

  const otherUserId =
    relationship.elderId === user.id
      ? relationship.familyMemberId
      : relationship.elderId;

  await prisma.notification.create({
    data: {
      recipientId: otherUserId,
      senderId: user.id,
      type: "SYSTEM_ALERT",
      title: "亲属绑定已解除",
      summary: `${user.name ?? user.email ?? "对方"} 已解除当前亲属绑定关系。`,
      relatedEntityType: "familyRelationship",
      relatedEntityId: relationship.id,
      payload: {
        relationshipId: relationship.id,
        elderId: relationship.elder.id,
        elderName: relationship.elder.name ?? relationship.elder.email,
      },
    },
  });

  revalidateFamilyUi();
  return success("家属绑定关系已解除。");
}

export async function sendEmotionUpdateNotificationAction(input: unknown) {
  const user = await requireUser();
  if (!user) {
    return failure("请先登录后再发送情绪更新。");
  }

  const parsed = SendEmotionUpdateNotificationInputSchema.safeParse(input);
  if (!parsed.success) {
    return formatValidationError(parsed.error);
  }

  const relationship = await prisma.familyRelationship.findFirst({
    where: {
      id: parsed.data.relationshipId,
      elderId: user.id,
      status: "ACCEPTED",
    },
    include: {
      familyMember: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!relationship) {
    return failure("只有已确认的家属关系才可以发送情绪概览。");
  }

  const snapshot = await getEmotionSnapshotForUser(user.id);
  if (!snapshot) {
    return failure("暂时没有可共享的情绪记录。");
  }

  const summary = snapshot.latestEmotion
    ? `最新情绪为“${snapshot.latestEmotion}”，共整理 ${snapshot.totalLogs} 条记录。`
    : "长者主动共享了一份新的情绪概览。";

  await prisma.notification.create({
    data: {
      recipientId: relationship.familyMemberId,
      senderId: user.id,
      type: "EMOTION_STATUS_UPDATE",
      title: "新的情绪状况更新",
      summary,
      relatedEntityType: "emotionLog",
      relatedEntityId: snapshot.elderId,
      payload: {
        elderId: snapshot.elderId,
        elderName: snapshot.elderName,
        latestEmotion: snapshot.latestEmotion,
        latestScore: snapshot.latestScore,
        latestLoggedAt: snapshot.latestLoggedAt,
        totalLogs: snapshot.totalLogs,
        dominantEmotion: snapshot.dominantEmotion,
      },
    },
  });

  revalidateFamilyUi();
  return success(
    `已向 ${relationship.familyMember.name ?? relationship.familyMember.email} 发送情绪更新提醒。`,
  );
}

export async function sendFamilyMessageAction(input: unknown) {
  const user = await requireUser();
  if (!user) {
    return failure("请先登录后再发送留言。");
  }

  const parsed = SendFamilyMessageInputSchema.safeParse(input);
  if (!parsed.success) {
    return formatValidationError(parsed.error);
  }

  const relationship = await prisma.familyRelationship.findFirst({
    where: {
      id: parsed.data.relationshipId,
      status: "ACCEPTED",
      OR: [{ elderId: user.id }, { familyMemberId: user.id }],
    },
    include: {
      elder: { select: { id: true, name: true, email: true } },
      familyMember: { select: { id: true, name: true, email: true } },
    },
  });

  if (!relationship) {
    return failure("仅已确认的亲属关系支持留言通知。");
  }

  const senderIsElder = relationship.elderId === user.id;
  const recipientId = senderIsElder
    ? relationship.familyMemberId
    : relationship.elderId;

  await prisma.notification.create({
    data: {
      recipientId,
      senderId: user.id,
      type: "FAMILY_MESSAGE",
      title: senderIsElder ? "来自长者的新留言" : "来自家属的新留言",
      summary: parsed.data.message,
      relatedEntityType: "familyRelationship",
      relatedEntityId: relationship.id,
      payload: {
        relationshipId: relationship.id,
        elderId: relationship.elder.id,
        elderName: relationship.elder.name ?? relationship.elder.email,
        familyMemberId: relationship.familyMember.id,
        familyMemberName:
          relationship.familyMember.name ?? relationship.familyMember.email,
        message: parsed.data.message,
      },
    },
  });

  revalidateFamilyUi();
  return success("留言已发送到通知中心。");
}

export async function markNotificationReadAction(input: unknown) {
  const user = await requireUser();
  if (!user) {
    return failure("请先登录后再操作通知。");
  }

  const parsed = MarkNotificationReadInputSchema.safeParse(input);
  if (!parsed.success) {
    return formatValidationError(parsed.error);
  }

  const notification = await prisma.notification.findFirst({
    where: {
      id: parsed.data.notificationId,
      recipientId: user.id,
    },
    select: { id: true, isRead: true },
  });

  if (!notification) {
    return failure("未找到对应通知。");
  }

  if (notification.isRead) {
    return success("通知已是已读状态。");
  }

  await prisma.notification.update({
    where: { id: notification.id },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  revalidateFamilyUi();
  return success("通知已标记为已读。");
}
