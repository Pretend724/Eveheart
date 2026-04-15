"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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

const RELATIONSHIP_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
} as const;

const NOTIFICATION_TYPE = {
  FAMILY_INVITE: "FAMILY_INVITE",
  FAMILY_INVITE_ACCEPTED: "FAMILY_INVITE_ACCEPTED",
  FAMILY_INVITE_REJECTED: "FAMILY_INVITE_REJECTED",
  FAMILY_MESSAGE: "FAMILY_MESSAGE",
  EMOTION_STATUS_UPDATE: "EMOTION_STATUS_UPDATE",
  SYSTEM_ALERT: "SYSTEM_ALERT",
} as const;

const RELATED_ENTITY_TYPE = {
  FAMILY_RELATIONSHIP: "familyRelationship",
  USER: "user",
} as const;

const MESSAGE_SUMMARY_MAX_LENGTH = 80;

function formatValidationError(error: z.ZodError) {
  const fieldErrors = error.flatten().fieldErrors;
  const firstMessage =
    Object.values(fieldErrors).flat().find(Boolean) ??
    "提交的数据无效，请检查后重试。";

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

function truncateMessageSummary(message: string) {
  const trimmed = message.trim();
  if (trimmed.length <= MESSAGE_SUMMARY_MAX_LENGTH) {
    return trimmed;
  }

  return `${trimmed.slice(0, MESSAGE_SUMMARY_MAX_LENGTH)}...`;
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
  try {
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

    const result = await prisma.$transaction(async (tx) => {
      const existingRelationship = await tx.familyRelationship.findUnique({
        where: {
          elderId_familyMemberId: {
            elderId: user.id,
            familyMemberId: targetUser.id,
          },
        },
        select: { id: true, status: true },
      });

      if (existingRelationship?.status === RELATIONSHIP_STATUS.ACCEPTED) {
        return failure("该家属已经与您绑定，无需重复邀请。");
      }

      if (existingRelationship?.status === RELATIONSHIP_STATUS.PENDING) {
        return success("邀请已发送，正在等待家属确认。");
      }

      const relationship = existingRelationship
        ? await tx.familyRelationship.update({
            where: { id: existingRelationship.id },
            data: {
              status: RELATIONSHIP_STATUS.PENDING,
              confirmedAt: null,
            },
          })
        : await tx.familyRelationship.create({
            data: {
              elderId: user.id,
              familyMemberId: targetUser.id,
              status: RELATIONSHIP_STATUS.PENDING,
              confirmedAt: null,
            },
          });

      await tx.notification.create({
        data: {
          recipientId: targetUser.id,
          senderId: user.id,
          type: NOTIFICATION_TYPE.FAMILY_INVITE,
          title: "新的家属绑定邀请",
          summary: `${inviter.name ?? inviter.email} 希望与您建立亲属绑定关系。`,
          relatedEntityType: RELATED_ENTITY_TYPE.FAMILY_RELATIONSHIP,
          relatedEntityId: relationship.id,
          payload: {
            relationshipId: relationship.id,
            elderId: inviter.id,
            elderName: inviter.name ?? inviter.email,
            familyMemberId: targetUser.id,
          },
        },
      });

      return success(`已向 ${targetUser.name ?? targetUser.email} 发送绑定邀请。`);
    });

    if (result.success) {
      revalidateFamilyUi();
    }

    return result;
  } catch (error) {
    console.error("[family-notifications][inviteFamilyMemberAction]", error, {
      input,
    });
    return failure("发送绑定邀请失败，请稍后重试。");
  }
}

export async function respondToFamilyInviteAction(input: unknown) {
  try {
    const user = await requireUser();
    if (!user) {
      return failure("请先登录后再处理邀请。");
    }

    const parsed = RespondToFamilyInviteInputSchema.safeParse(input);
    if (!parsed.success) {
      return formatValidationError(parsed.error);
    }

    const result = await prisma.$transaction(async (tx) => {
      const relationship = await tx.familyRelationship.findFirst({
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

      if (relationship.status !== RELATIONSHIP_STATUS.PENDING) {
        if (relationship.status === RELATIONSHIP_STATUS.ACCEPTED) {
          return failure("该邀请已被处理为接受状态，不能重复处理。");
        }

        return failure("该邀请已被处理为拒绝状态，如需重新绑定请由长者再次发起邀请。");
      }

      const accepted = parsed.data.decision === "accept";

      await tx.familyRelationship.update({
        where: { id: relationship.id },
        data: {
          status: accepted
            ? RELATIONSHIP_STATUS.ACCEPTED
            : RELATIONSHIP_STATUS.REJECTED,
          confirmedAt: accepted ? new Date() : null,
        },
      });

      await tx.notification.create({
        data: {
          recipientId: relationship.elderId,
          senderId: user.id,
          type: accepted
            ? NOTIFICATION_TYPE.FAMILY_INVITE_ACCEPTED
            : NOTIFICATION_TYPE.FAMILY_INVITE_REJECTED,
          title: accepted ? "家属邀请已接受" : "家属邀请被婉拒",
          summary: accepted
            ? `${user.name ?? user.email ?? "家属"} 已接受您的绑定邀请。`
            : `${user.name ?? user.email ?? "家属"} 暂未接受您的绑定邀请。`,
          relatedEntityType: RELATED_ENTITY_TYPE.FAMILY_RELATIONSHIP,
          relatedEntityId: relationship.id,
          payload: {
            relationshipId: relationship.id,
            elderId: relationship.elder.id,
            elderName: relationship.elder.name ?? relationship.elder.email,
          },
        },
      });

      return success(accepted ? "已接受邀请。" : "已拒绝邀请。");
    });

    if (result.success) {
      revalidateFamilyUi();
    }

    return result;
  } catch (error) {
    console.error("[family-notifications][respondToFamilyInviteAction]", error, {
      input,
    });
    return failure("处理邀请失败，请稍后重试。");
  }
}

export async function removeFamilyRelationshipAction(input: unknown) {
  try {
    const user = await requireUser();
    if (!user) {
      return failure("请先登录后再操作。");
    }

    const parsed = RemoveFamilyRelationshipInputSchema.safeParse(input);
    if (!parsed.success) {
      return formatValidationError(parsed.error);
    }

    const result = await prisma.$transaction(async (tx) => {
      const relationship = await tx.familyRelationship.findFirst({
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

      const otherUserId =
        relationship.elderId === user.id
          ? relationship.familyMemberId
          : relationship.elderId;

      await tx.familyRelationship.delete({
        where: { id: relationship.id },
      });

      await tx.notification.create({
        data: {
          recipientId: otherUserId,
          senderId: user.id,
          type: NOTIFICATION_TYPE.SYSTEM_ALERT,
          title: "亲属绑定已解除",
          summary: `${user.name ?? user.email ?? "对方"} 已解除当前亲属绑定关系。`,
          relatedEntityType: RELATED_ENTITY_TYPE.FAMILY_RELATIONSHIP,
          relatedEntityId: relationship.id,
          payload: {
            relationshipId: relationship.id,
            elderId: relationship.elder.id,
            elderName: relationship.elder.name ?? relationship.elder.email,
          },
        },
      });

      return success("家属绑定关系已解除。");
    });

    if (result.success) {
      revalidateFamilyUi();
    }

    return result;
  } catch (error) {
    console.error("[family-notifications][removeFamilyRelationshipAction]", error, {
      input,
    });
    return failure("解除绑定失败，请稍后重试。");
  }
}

export async function sendEmotionUpdateNotificationAction(input: unknown) {
  try {
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
        status: RELATIONSHIP_STATUS.ACCEPTED,
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
        type: NOTIFICATION_TYPE.EMOTION_STATUS_UPDATE,
        title: "新的情绪状况更新",
        summary,
        relatedEntityType: RELATED_ENTITY_TYPE.USER,
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
  } catch (error) {
    console.error(
      "[family-notifications][sendEmotionUpdateNotificationAction]",
      error,
      { input },
    );
    return failure("发送情绪概览失败，请稍后重试。");
  }
}

export async function sendFamilyMessageAction(input: unknown) {
  try {
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
        status: RELATIONSHIP_STATUS.ACCEPTED,
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
        type: NOTIFICATION_TYPE.FAMILY_MESSAGE,
        title: senderIsElder ? "来自长者的新留言" : "来自家属的新留言",
        summary: truncateMessageSummary(parsed.data.message),
        relatedEntityType: RELATED_ENTITY_TYPE.FAMILY_RELATIONSHIP,
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
  } catch (error) {
    console.error("[family-notifications][sendFamilyMessageAction]", error, {
      input,
    });
    return failure("发送留言失败，请稍后重试。");
  }
}

export async function markNotificationReadAction(input: unknown) {
  try {
    const user = await requireUser();
    if (!user) {
      return failure("请先登录后再操作通知。");
    }

    const parsed = MarkNotificationReadInputSchema.safeParse(input);
    if (!parsed.success) {
      return formatValidationError(parsed.error);
    }

    const { count } = await prisma.notification.updateMany({
      where: {
        id: parsed.data.notificationId,
        recipientId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    if (count > 0) {
      revalidateFamilyUi();
      return success("通知已标记为已读。");
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: parsed.data.notificationId,
        recipientId: user.id,
      },
      select: { isRead: true },
    });

    if (!notification) {
      return failure("未找到对应通知。");
    }

    return success("通知已是已读状态。");
  } catch (error) {
    console.error("[family-notifications][markNotificationReadAction]", error, {
      input,
    });
    return failure("更新通知状态失败，请稍后重试。");
  }
}
