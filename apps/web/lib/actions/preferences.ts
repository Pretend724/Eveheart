"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@eveheart/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const savePreferencesInputSchema = z.object({
  aiProvider: z.string().trim().min(1),
  aiModel: z.string().trim().min(1),
  aiApiKey: z.string().optional().nullable(),
  aiBaseUrl: z.string().optional().nullable(),
  personaName: z.string().trim().min(1).max(20),
  avatarIdentifier: z.enum(["muxin", "muchen"]).nullable().optional(),
  replyLanguage: z.string().trim().min(1),
  voiceEnabled: z.boolean(),
  voiceSpeed: z.enum(["slow", "normal", "fast"]),
  fontSize: z.enum(["standard", "large", "xl", "xxl"]),
  elderlyMode: z.boolean(),
  highContrast: z.boolean(),
  reminderEnabled: z.boolean(),
  reminderTime: z.string().trim().min(1),
  reminderFreq: z.enum(["daily", "weekdays", "weekly"]),
});

export type SavePreferencesInput = z.infer<typeof savePreferencesInputSchema>;

/**
 * Upserts the authenticated user's preferences record.
 * Empty strings for aiApiKey / aiBaseUrl are coerced to null
 * so they are not stored as blank strings in the database.
 */
export async function savePreferencesAction(
  input: SavePreferencesInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "未授权，请重新登录。" };
    }

    const parsed = savePreferencesInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "提交的偏好设置无效，请检查后重试。" };
    }

    const sanitised = {
      ...parsed.data,
      aiApiKey: parsed.data.aiApiKey?.trim() || null,
      aiBaseUrl: parsed.data.aiBaseUrl?.trim() || null,
      personaName: parsed.data.personaName.trim() || "Eveheart",
      avatarIdentifier: parsed.data.avatarIdentifier ?? null,
    };

    await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...sanitised },
      update: sanitised,
    });

    revalidatePath("/dashboard/setting/preferences-setting");
    revalidatePath("/aging-friendly/settings");
    return { success: true };
  } catch (error) {
    console.error("[savePreferencesAction]", error);
    return { success: false, error: "保存失败，请稍后重试。" };
  }
}
