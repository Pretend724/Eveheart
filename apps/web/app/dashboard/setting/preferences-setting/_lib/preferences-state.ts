import type { SavePreferencesInput } from "@/lib/actions/preferences";
import type {
  AvatarIdentifier,
  FontSize,
  PreferencesFormState,
  Provider,
  ReminderFreq,
  UserPreferencesRow,
  VoiceSpeed,
} from "./preferences-types";

const DEFAULT_PROVIDER: Provider = "siliconflow";
const DEFAULT_MODEL = "mimo-v2-flash";
const DEFAULT_PERSONA_NAME = "Eveheart";
const DEFAULT_AVATAR: AvatarIdentifier = "muxin";

export function createPreferencesState(
  preferences: UserPreferencesRow | null,
): PreferencesFormState {
  return {
    provider: (preferences?.aiProvider as Provider) ?? DEFAULT_PROVIDER,
    apiKey: preferences?.aiApiKey ?? "",
    baseUrl: preferences?.aiBaseUrl ?? "",
    model: preferences?.aiModel ?? DEFAULT_MODEL,
    customModel:
      preferences?.aiProvider === "custom" ? (preferences?.aiModel ?? "") : "",
    personaName: preferences?.personaName ?? DEFAULT_PERSONA_NAME,
    avatarIdentifier: normalizeAvatar(preferences?.avatarIdentifier),
    replyLanguage: preferences?.replyLanguage ?? "zh-CN",
    voiceEnabled: preferences?.voiceEnabled ?? true,
    voiceSpeed: (preferences?.voiceSpeed as VoiceSpeed) ?? "normal",
    fontSize: (preferences?.fontSize as FontSize) ?? "standard",
    elderlyMode: preferences?.elderlyMode ?? false,
    highContrast: preferences?.highContrast ?? false,
    reminderEnabled: preferences?.reminderEnabled ?? false,
    reminderTime: preferences?.reminderTime ?? "20:00",
    reminderFreq: (preferences?.reminderFreq as ReminderFreq) ?? "daily",
  };
}

export function isPreferencesDirty(
  draft: PreferencesFormState,
  committed: PreferencesFormState,
): boolean {
  return (Object.keys(draft) as (keyof PreferencesFormState)[]).some(
    (key) => draft[key] !== committed[key],
  );
}

export function toSavePreferencesInput(
  state: PreferencesFormState,
): SavePreferencesInput {
  return {
    aiProvider: state.provider,
    aiModel: state.provider === "custom" ? state.customModel : state.model,
    aiApiKey: state.apiKey || null,
    aiBaseUrl: state.baseUrl || null,
    personaName: state.personaName,
    avatarIdentifier: state.avatarIdentifier,
    replyLanguage: state.replyLanguage,
    voiceEnabled: state.voiceEnabled,
    voiceSpeed: state.voiceSpeed,
    fontSize: state.fontSize,
    elderlyMode: state.elderlyMode,
    highContrast: state.highContrast,
    reminderEnabled: state.reminderEnabled,
    reminderTime: state.reminderTime,
    reminderFreq: state.reminderFreq,
  };
}

function normalizeAvatar(
  avatarIdentifier: string | null | undefined,
): AvatarIdentifier {
  return avatarIdentifier === "muxin" || avatarIdentifier === "muchen"
    ? avatarIdentifier
    : DEFAULT_AVATAR;
}
