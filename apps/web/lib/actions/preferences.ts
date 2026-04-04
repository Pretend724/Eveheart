"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@eveheart/db";
import { revalidatePath } from "next/cache";

// ─── Input Type ───────────────────────────────────────────────────────────────

export type SavePreferencesInput = {
  // AI Provider
  aiProvider: string;
  aiModel: string;
  aiApiKey?: string | null;
  aiBaseUrl?: string | null;
  // Chat Experience
  personaName: string;
  replyLanguage: string;
  voiceEnabled: boolean;
  voiceSpeed: string;
  // Display & Accessibility
  fontSize: string;
  elderlyMode: boolean;
  highContrast: boolean;
  // Notifications
  reminderEnabled: boolean;
  reminderTime: string;
  reminderFreq: string;
};

// ─── Action ───────────────────────────────────────────────────────────────────

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

    const sanitised = {
      ...input,
      // Treat empty string as "not set"
      aiApiKey: input.aiApiKey?.trim() || null,
      aiBaseUrl: input.aiBaseUrl?.trim() || null,
      // Trim the persona name
      personaName: input.personaName.trim() || "Eveheart",
    };

    await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...sanitised },
      update: sanitised,
    });

    revalidatePath("/dashboard/setting/preferences-setting");
    return { success: true };
  } catch (error) {
    console.error("[savePreferencesAction]", error);
    return { success: false, error: "保存失败，请稍后重试。" };
  }
}
