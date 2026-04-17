import { z } from "zod";

export const familyRelationshipStatusValues = [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
] as const;

export const notificationTypeValues = [
  "FAMILY_INVITE",
  "FAMILY_INVITE_ACCEPTED",
  "FAMILY_INVITE_REJECTED",
  "FAMILY_MESSAGE",
  "EMOTION_STATUS_UPDATE",
  "SYSTEM_ALERT",
] as const;

export const FamilyActionResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
});

export const InviteFamilyMemberInputSchema = z.object({
  query: z.string().trim().min(1, "请输入家属用户名或邮箱").max(120),
});

export const RespondToFamilyInviteInputSchema = z.object({
  relationshipId: z.string().uuid("邀请记录无效"),
  decision: z.enum(["accept", "reject"]),
});

export const RemoveFamilyRelationshipInputSchema = z.object({
  relationshipId: z.string().uuid("绑定记录无效"),
});

export const SendEmotionUpdateNotificationInputSchema = z.object({
  relationshipId: z.string().uuid("绑定记录无效"),
});

export const SendFamilyMessageInputSchema = z.object({
  relationshipId: z.string().uuid("绑定记录无效"),
  message: z
    .string()
    .trim()
    .min(1, "请输入留言内容")
    .max(280, "留言内容不能超过 280 个字符"),
});

export const MarkNotificationReadInputSchema = z.object({
  notificationId: z.string().uuid("通知记录无效"),
});

export const DeleteNotificationInputSchema = z.object({
  notificationId: z.string().uuid("通知记录无效"),
});

export const NotificationsQuerySchema = z.object({
  take: z.coerce.number().int().min(1).max(50).default(20),
});

export const EmotionSnapshotEntrySchema = z.object({
  emotion: z.string(),
  score: z.number(),
  source: z.string(),
  createdAt: z.string(),
});

export const EmotionSnapshotSchema = z.object({
  elderId: z.string().uuid(),
  elderName: z.string(),
  latestEmotion: z.string().nullable(),
  latestScore: z.number().nullable(),
  latestSource: z.string().nullable(),
  latestLoggedAt: z.string().nullable(),
  totalLogs: z.number().int().nonnegative(),
  dominantEmotion: z.string().nullable(),
  averageScore: z.number().nullable(),
  recentEntries: z.array(EmotionSnapshotEntrySchema),
});

export const NotificationSenderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  email: z.string().email().nullable(),
  image: z.string().nullable(),
});

export const NotificationRecordSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  summary: z.string(),
  type: z.enum(notificationTypeValues),
  isRead: z.boolean(),
  relatedEntityType: z.string().nullable(),
  relatedEntityId: z.string().nullable(),
  createdAt: z.string(),
  readAt: z.string().nullable(),
  sender: NotificationSenderSchema.nullable(),
  payload: z.record(z.string(), z.unknown()).nullable(),
});

export const NotificationsResponseSchema = z.object({
  notifications: z.array(NotificationRecordSchema),
  unreadCount: z.number().int().nonnegative(),
  quietHoursActive: z.boolean(),
  preferences: z.object({
    elderlyMode: z.boolean(),
    highContrast: z.boolean(),
    quietHoursEnabled: z.boolean(),
    quietHoursStart: z.string(),
    quietHoursEnd: z.string(),
  }),
});

export type FamilyActionResult = z.infer<typeof FamilyActionResultSchema>;
export type InviteFamilyMemberInput = z.infer<typeof InviteFamilyMemberInputSchema>;
export type RespondToFamilyInviteInput = z.infer<typeof RespondToFamilyInviteInputSchema>;
export type RemoveFamilyRelationshipInput = z.infer<typeof RemoveFamilyRelationshipInputSchema>;
export type SendEmotionUpdateNotificationInput = z.infer<
  typeof SendEmotionUpdateNotificationInputSchema
>;
export type SendFamilyMessageInput = z.infer<typeof SendFamilyMessageInputSchema>;
export type MarkNotificationReadInput = z.infer<typeof MarkNotificationReadInputSchema>;
export type DeleteNotificationInput = z.infer<typeof DeleteNotificationInputSchema>;
export type EmotionSnapshot = z.infer<typeof EmotionSnapshotSchema>;
export type NotificationRecord = z.infer<typeof NotificationRecordSchema>;
export type NotificationsResponse = z.infer<typeof NotificationsResponseSchema>;
