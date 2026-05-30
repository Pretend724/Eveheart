"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AIServiceSection } from "./_components/ai-service-section";
import { AvatarSection } from "./_components/avatar-section";
import { ChatExperienceSection } from "./_components/chat-experience-section";
import { DisplayAccessibilitySection } from "./_components/display-accessibility-section";
import { FloatingSaveBar } from "./_components/floating-save-bar";
import { ReminderSection } from "./_components/reminder-section";
import { PROVIDERS } from "./_lib/preferences-data";
import {
  createPreferencesState,
  isPreferencesDirty,
  toSavePreferencesInput,
} from "./_lib/preferences-state";
import type {
  AvatarIdentifier,
  PreferencesFormState,
  Provider,
  TestStatus,
  UserPreferencesRow,
} from "./_lib/preferences-types";
import { savePreferencesAction } from "@/lib/actions/preferences";

export type { UserPreferencesRow } from "./_lib/preferences-types";

export function PreferencesClient({
  initialPreferences,
}: {
  initialPreferences: UserPreferencesRow | null;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [draft, setDraft] = useState<PreferencesFormState>(() =>
    createPreferencesState(initialPreferences),
  );
  const [committed, setCommitted] = useState<PreferencesFormState>(() =>
    createPreferencesState(initialPreferences),
  );

  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMessage, setTestMessage] = useState("");
  const [testLatency, setTestLatency] = useState<number | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isDirty = useMemo(
    () => isPreferencesDirty(draft, committed),
    [draft, committed],
  );

  function resetConnectionTest() {
    setTestStatus("idle");
    setTestMessage("");
    setTestLatency(null);
  }

  function updateDraft<K extends keyof PreferencesFormState>(
    key: K,
    value: PreferencesFormState[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleProviderChange(next: Provider) {
    const providerConfig = PROVIDERS.find((provider) => provider.id === next);

    setDraft((current) => ({
      ...current,
      provider: next,
      model: providerConfig?.models.length ? providerConfig.models[0] : current.model,
    }));
    resetConnectionTest();
  }

  function handleAvatarChange(next: AvatarIdentifier) {
    updateDraft("avatarIdentifier", next);
  }

  function handleElderlyModeChange(enabled: boolean) {
    setDraft((current) => ({
      ...current,
      elderlyMode: enabled,
      fontSize: enabled ? "xxl" : current.fontSize,
    }));
  }

  async function handleTestConnection() {
    setTestStatus("loading");
    setTestMessage("");
    setTestLatency(null);

    try {
      const response = await fetch("/api/preferences/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: draft.provider,
          apiKey: draft.apiKey,
          baseUrl: draft.baseUrl,
          model: draft.provider === "custom" ? draft.customModel : draft.model,
        }),
      });
      const data: { success: boolean; message: string; latencyMs?: number } =
        await response.json();

      setTestStatus(data.success ? "success" : "error");
      setTestMessage(data.message);
      setTestLatency(data.latencyMs ?? null);
    } catch {
      setTestStatus("error");
      setTestMessage("网络请求失败，请检查网络连接。");
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    const result = await savePreferencesAction(toSavePreferencesInput(draft));
    setIsSaving(false);

    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setCommitted(draft);

      if (draft.elderlyMode) {
        router.push("/aging-friendly/settings");
      } else if (pathname.startsWith("/aging-friendly")) {
        router.push("/dashboard/setting/preferences-setting");
      }
      return;
    }

    setSaveError(result.error ?? "保存失败");
  }

  return (
    <main className="min-h-screen p-5 pb-24">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="mb-12">
          <h3 className="font-headline text-4xl font-extrabold tracking-tight text-foreground">
            偏好设置
          </h3>
          <p className="mt-2 text-lg text-muted-foreground">
            自定义 Eveheart 的 AI 服务、对话风格与显示偏好。
          </p>
        </div>

        <AIServiceSection
          provider={draft.provider}
          apiKey={draft.apiKey}
          baseUrl={draft.baseUrl}
          model={draft.model}
          customModel={draft.customModel}
          testStatus={testStatus}
          testMessage={testMessage}
          testLatency={testLatency}
          onProviderChange={handleProviderChange}
          onApiKeyChange={(value) => {
            updateDraft("apiKey", value);
            resetConnectionTest();
          }}
          onBaseUrlChange={(value) => updateDraft("baseUrl", value)}
          onModelChange={(value) => updateDraft("model", value)}
          onCustomModelChange={(value) => updateDraft("customModel", value)}
          onTestConnection={handleTestConnection}
        />

        <AvatarSection
          selectedAvatar={draft.avatarIdentifier}
          onAvatarChange={handleAvatarChange}
        />

        <ChatExperienceSection
          personaName={draft.personaName}
          replyLanguage={draft.replyLanguage}
          voiceEnabled={draft.voiceEnabled}
          voiceSpeed={draft.voiceSpeed}
          onPersonaNameChange={(value) => updateDraft("personaName", value)}
          onReplyLanguageChange={(value) => updateDraft("replyLanguage", value)}
          onVoiceEnabledChange={(value) => updateDraft("voiceEnabled", value)}
          onVoiceSpeedChange={(value) => updateDraft("voiceSpeed", value)}
        />

        <DisplayAccessibilitySection
          elderlyMode={draft.elderlyMode}
          onElderlyModeChange={handleElderlyModeChange}
        />

        <ReminderSection
          reminderEnabled={draft.reminderEnabled}
          reminderTime={draft.reminderTime}
          reminderFreq={draft.reminderFreq}
          onReminderEnabledChange={(value) =>
            updateDraft("reminderEnabled", value)
          }
          onReminderTimeChange={(value) => updateDraft("reminderTime", value)}
          onReminderFreqChange={(value) => updateDraft("reminderFreq", value)}
        />
      </div>

      <FloatingSaveBar
        visible={isDirty || !!saveError}
        saveError={saveError}
        saveSuccess={saveSuccess}
        isSaving={isSaving}
        onSave={handleSave}
      />
    </main>
  );
}
