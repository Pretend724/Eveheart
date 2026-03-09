import { z } from "zod";

export const EmotionSchema = z.object({
  emotion: z.string(),
  confidence: z.number().min(0).max(1),
  source: z.enum(["face", "voice", "text"]),
});

export const MultiModalEmotionSchema = z.object({
  face: EmotionSchema.optional(),
  voice: EmotionSchema.optional(),
  text: EmotionSchema.optional(),
});

export type EmotionInput = z.infer<typeof EmotionSchema>;
export type MultiModalEmotionInput = z.infer<typeof MultiModalEmotionSchema>;
