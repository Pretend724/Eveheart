import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

const siliconflow = createOpenAICompatible({
  name: "siliconflow",
  apiKey: process.env.SILICONFLOW_API_KEY,
  baseURL: "https://api.siliconflow.cn/v1/",
  includeUsage: true,
});

const BUILTIN_MODEL = "Pro/MiniMaxAI/MiniMax-M2.5";

const PROVIDER_BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1/",
  deepseek: "https://api.deepseek.com/v1/",
};

export type ProviderPrefs = {
  aiProvider: string;
  aiModel: string;
  aiApiKey: string | null;
  aiBaseUrl: string | null;
};

export function resolveModel(prefs: ProviderPrefs | null): LanguageModel {
  try {
    if (!prefs || prefs.aiProvider === "siliconflow") {
      return siliconflow(prefs?.aiModel ?? BUILTIN_MODEL);
    }

    const { aiProvider, aiModel, aiApiKey, aiBaseUrl } = prefs;
    const apiKey = aiApiKey?.trim();

    if (!apiKey) {
      console.warn(
        `[chat] Provider "${aiProvider}" selected but no API key set - falling back to built-in.`,
      );
      return siliconflow(BUILTIN_MODEL);
    }

    let baseURL: string;
    if (aiProvider === "custom") {
      baseURL = aiBaseUrl?.trim() ?? "";
      if (!baseURL) {
        console.warn(
          "[chat] Custom provider selected but no Base URL set - falling back to built-in.",
        );
        return siliconflow(BUILTIN_MODEL);
      }

      if (!baseURL.endsWith("/")) baseURL += "/";
    } else {
      baseURL = PROVIDER_BASE_URLS[aiProvider] ?? "";
      if (!baseURL) {
        console.warn(
          `[chat] Unknown provider "${aiProvider}" - falling back to built-in.`,
        );
        return siliconflow(BUILTIN_MODEL);
      }
    }

    const client = createOpenAICompatible({
      name: aiProvider,
      apiKey,
      baseURL,
    });

    return client(aiModel || BUILTIN_MODEL);
  } catch (err) {
    console.error("[chat] Error resolving AI model, using built-in:", err);
    return siliconflow(BUILTIN_MODEL);
  }
}
