"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const UpdateUsernameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "请输入用户名")
    .max(32, "用户名最多 32 个字符"),
});

export type UpdateUsernameActionState = {
  error: string;
  success: string;
};

const UpdatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "请输入当前密码"),
    newPassword: z.string().min(6, "新密码至少 6 位"),
    confirmPassword: z.string().min(1, "请确认新密码"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "两次输入的新密码不一致",
    path: ["confirmPassword"],
  });

export type UpdatePasswordActionState = {
  error: string;
  success: string;
};

export type ClearConversationHistoryActionState = {
  error: string;
  success: string;
};

const RetentionPolicySchema = z.object({
  retentionPolicy: z.enum([
    "ONE_YEAR",
    "SIX_MONTHS",
    "THIRTY_DAYS",
    "MANUAL_ONLY",
  ]),
});

export type UpdateRetentionPolicyActionState = {
  error: string;
  success: string;
};

const retentionPolicyLabelMap = {
  ONE_YEAR: "保留 1 年",
  SIX_MONTHS: "保留 6 个月",
  THIRTY_DAYS: "30 天后自动删除",
  MANUAL_ONLY: "仅手动删除",
} as const;

export async function updateUsernameAction(
  _prevState: UpdateUsernameActionState,
  formData: FormData,
): Promise<UpdateUsernameActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "请先登录", success: "" };
  }

  const validation = UpdateUsernameSchema.safeParse({
    name: formData.get("name"),
  });

  if (!validation.success) {
    const message = validation.error.issues[0]?.message ?? "表单数据无效";
    return { error: message, success: "" };
  }

  const nextName = validation.data.name;

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });

  if (currentUser?.name?.trim() === nextName) {
    return { error: "", success: "用户名未发生变化" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: nextName },
  });

  revalidatePath("/dashboard/setting/account-setting");

  return { error: "", success: "用户名已更新" };
}

export async function updatePasswordAction(
  _prevState: UpdatePasswordActionState,
  formData: FormData,
): Promise<UpdatePasswordActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "请先登录", success: "" };
  }

  const validation = UpdatePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validation.success) {
    const message = validation.error.issues[0]?.message ?? "表单数据无效";
    return { error: message, success: "" };
  }

  const { currentPassword, newPassword } = validation.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!user?.password) {
    return {
      error: "当前账号未设置密码，暂不支持修改密码",
      success: "",
    };
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password,
  );

  if (!isCurrentPasswordValid) {
    return { error: "当前密码错误", success: "" };
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);

  if (isSamePassword) {
    return { error: "新密码不能与当前密码相同", success: "" };
  }

  const nextPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: nextPassword },
  });

  revalidatePath("/dashboard/setting/account-setting");

  return { error: "", success: "密码已更新" };
}

export async function clearConversationHistoryAction(
  _prevState: ClearConversationHistoryActionState,
): Promise<ClearConversationHistoryActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "请先登录", success: "" };
  }

  const meaningfulSessionCount = await prisma.chatSession.count({
    where: {
      userId: session.user.id,
      messages: {
        some: {},
      },
    },
  });

  await prisma.chatSession.deleteMany({
    where: { userId: session.user.id },
  });

  revalidatePath("/dashboard/chat", "layout");
  revalidatePath("/dashboard/chat");
  revalidatePath("/dashboard/setting/account-setting");

  if (meaningfulSessionCount === 0) {
    return { error: "", success: "暂无可清理的聊天记录" };
  }

  return { error: "", success: `已清理 ${meaningfulSessionCount} 条会话记录` };
}

export async function updateRetentionPolicyAction(
  _prevState: UpdateRetentionPolicyActionState,
  formData: FormData,
): Promise<UpdateRetentionPolicyActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "请先登录", success: "" };
  }

  const validation = RetentionPolicySchema.safeParse({
    retentionPolicy: formData.get("retentionPolicy"),
  });

  if (!validation.success) {
    const message = validation.error.issues[0]?.message ?? "表单数据无效";
    return { error: message, success: "" };
  }

  const { retentionPolicy } = validation.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { retentionPolicy },
  });

  revalidatePath("/dashboard/setting/account-setting");

  return {
    error: "",
    success: `数据保留策略已更新为「${retentionPolicyLabelMap[retentionPolicy]}」`,
  };
}
