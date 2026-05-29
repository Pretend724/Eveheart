import "server-only";

import { cache } from "react";
import { APP_CONFIG_DEFAULTS } from "@/app-config";
import type { AppConfig } from "@/app-config";

export const CONFIG_ENDPOINT = process.env.NEXT_PUBLIC_APP_CONFIG_ENDPOINT;
export const SANDBOX_ID = process.env.SANDBOX_ID;

export interface SandboxConfig {
  [key: string]:
    | { type: "string"; value: string }
    | { type: "number"; value: number }
    | { type: "boolean"; value: boolean }
    | null;
}

export const getAppConfig = cache(
  async (headers: Headers): Promise<AppConfig> => {
    if (CONFIG_ENDPOINT) {
      const sandboxId = SANDBOX_ID ?? headers.get("x-sandbox-id") ?? "";

      try {
        if (!sandboxId) {
          throw new Error("Sandbox ID is required");
        }

        const response = await fetch(CONFIG_ENDPOINT, {
          cache: "no-store",
          headers: { "X-Sandbox-ID": sandboxId },
        });

        if (response.ok) {
          const remoteConfig: SandboxConfig = await response.json();
          const config: AppConfig = { ...APP_CONFIG_DEFAULTS, sandboxId };

          for (const [key, entry] of Object.entries(remoteConfig)) {
            if (entry === null) continue;

            if (
              (key in APP_CONFIG_DEFAULTS &&
                APP_CONFIG_DEFAULTS[key as keyof AppConfig] === undefined) ||
              (typeof config[key as keyof AppConfig] === entry.type &&
                typeof config[key as keyof AppConfig] === typeof entry.value)
            ) {
              // @ts-expect-error Runtime validation above narrows remote values.
              config[key as keyof AppConfig] =
                entry.value as AppConfig[keyof AppConfig];
            }
          }

          return config;
        }

        console.error(
          `ERROR: querying config endpoint failed with status ${response.status}: ${response.statusText}`,
        );
      } catch (error) {
        console.error("ERROR: getAppConfig() - lib/app-config/server.ts", error);
      }
    }

    return APP_CONFIG_DEFAULTS;
  },
);
