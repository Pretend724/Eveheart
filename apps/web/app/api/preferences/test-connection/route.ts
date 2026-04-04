import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type TestConnectionBody = {
  provider: "siliconflow" | "openai" | "deepseek" | "custom";
  apiKey?: string;
  baseUrl?: string;
  model?: string;
};

type TestConnectionResult = {
  success: boolean;
  message: string;
  latencyMs?: number;
};

// ─── Provider Endpoints ───────────────────────────────────────────────────────

const PROVIDER_MODELS_URL: Record<string, string> = {
  openai: "https://api.openai.com/v1/models",
  deepseek: "https://api.deepseek.com/v1/models",
};

// ─── POST /api/preferences/test-connection ────────────────────────────────────
/**
 * Tests connectivity to the specified AI provider using the supplied credentials.
 *
 * For the built-in "siliconflow" provider this is a no-op success (the server manages
 * that key itself). For all other providers we make a lightweight GET to the
 * provider's /v1/models endpoint and check the HTTP status.
 *
 * Body: { provider, apiKey?, baseUrl?, model? }
 */
export async function POST(req: NextRequest): Promise<NextResponse<TestConnectionResult>> {
  // ── Auth guard ─────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "未授权，请先登录。" },
      { status: 401 },
    );
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: TestConnectionBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "请求格式错误。" },
      { status: 400 },
    );
  }

  const { provider, apiKey, baseUrl } = body;

  // ── Built-in provider: always succeeds ────────────────────────────────────
  if (provider === "siliconflow") {
    return NextResponse.json({
      success: true,
      message: "内置服务连接正常，无需额外配置。",
      latencyMs: 0,
    });
  }

  // ── External providers: validate inputs ───────────────────────────────────
  if (!apiKey) {
    return NextResponse.json(
      { success: false, message: "请先填写 API 密钥再进行测试。" },
      { status: 400 },
    );
  }

  if (provider === "custom" && !baseUrl) {
    return NextResponse.json(
      { success: false, message: "自定义接口需要填写 Base URL。" },
      { status: 400 },
    );
  }

  // ── Resolve the models endpoint URL ──────────────────────────────────────
  let modelsUrl: string;
  if (provider === "custom") {
    const trimmed = baseUrl!.replace(/\/+$/, "");
    modelsUrl = `${trimmed}/models`;
  } else {
    modelsUrl = PROVIDER_MODELS_URL[provider];
  }

  // ── Make the test request ─────────────────────────────────────────────────
  const startMs = Date.now();
  try {
    const response = await fetch(modelsUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      // 10-second timeout to avoid hanging the serverless function
      signal: AbortSignal.timeout(10_000),
    });

    const latencyMs = Date.now() - startMs;

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: `连接成功，延迟 ${latencyMs} ms。`,
        latencyMs,
      });
    }

    // Try to extract the provider's error message
    let providerError = response.statusText;
    try {
      const json = await response.json();
      providerError = json?.error?.message ?? json?.message ?? providerError;
    } catch {
      // ignore JSON parse error
    }

    return NextResponse.json({
      success: false,
      message: `连接失败（${response.status}）：${providerError}`,
      latencyMs,
    });
  } catch (err) {
    const latencyMs = Date.now() - startMs;
    const isTimeout =
      err instanceof Error &&
      (err.name === "TimeoutError" || err.message.includes("timeout"));

    return NextResponse.json({
      success: false,
      message: isTimeout
        ? "连接超时（10s），请检查网络或 Base URL 是否正确。"
        : "网络请求失败，请检查网络连接或服务地址。",
      latencyMs,
    });
  }
}
