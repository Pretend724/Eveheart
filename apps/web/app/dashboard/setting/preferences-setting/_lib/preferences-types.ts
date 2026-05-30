export type UserPreferencesRow = {
  aiProvider: string;
  aiModel: string;
  aiApiKey: string | null;
  aiBaseUrl: string | null;
  personaName: string;
  avatarIdentifier?: string | null;
  replyLanguage: string;
  voiceEnabled: boolean;
  voiceSpeed: string;
  fontSize: string;
  elderlyMode: boolean;
  highContrast: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
  reminderFreq: string;
};

export type Provider = "siliconflow" | "openai" | "deepseek" | "custom";
export type AvatarIdentifier = "muxin" | "muchen";
export type FontSize = "standard" | "large" | "xl" | "xxl";
export type VoiceSpeed = "slow" | "normal" | "fast";
export type ReminderFreq = "daily" | "weekdays" | "weekly";
export type TestStatus = "idle" | "loading" | "success" | "error";

export type PreferencesFormState = {
  provider: Provider;
  apiKey: string;
  baseUrl: string;
  model: string;
  customModel: string;
  personaName: string;
  avatarIdentifier: AvatarIdentifier | null;
  replyLanguage: string;
  voiceEnabled: boolean;
  voiceSpeed: VoiceSpeed;
  fontSize: FontSize;
  elderlyMode: boolean;
  highContrast: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
  reminderFreq: ReminderFreq;
};
