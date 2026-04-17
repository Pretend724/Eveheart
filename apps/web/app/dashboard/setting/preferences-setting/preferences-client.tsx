"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BotIcon,
  KeyIcon,
  GlobeIcon,
  ZapIcon,
  BellIcon,
  MonitorIcon,
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
  SaveIcon,
  WifiIcon,
  MessageCircleIcon,
  UserIcon,
} from "lucide-react";
import { OpenAI, DeepSeek, SiliconCloud } from '@lobehub/icons';
import {
  savePreferencesAction,
  type SavePreferencesInput,
} from "@/lib/actions/preferences";

// ─── Local DB Row Type ────────────────────────────────────────────────────────
// Mirrors the UserPreferences Prisma model fields used here.

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

// ─── Types ────────────────────────────────────────────────────────────────────

type Provider = "siliconflow" | "openai" | "deepseek" | "custom";
type AvatarIdentifier = "muxin" | "muchen";
type FontSize = "standard" | "large" | "xl" | "xxl";
type VoiceSpeed = "slow" | "normal" | "fast";
type ReminderFreq = "daily" | "weekdays" | "weekly";
type TestStatus = "idle" | "loading" | "success" | "error";

type CommittedPreferencesState = {
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

// ─── Static Data ──────────────────────────────────────────────────────────────

const PROVIDERS: {
  id: Provider;
  name: string;
  desc: string;
  badge: string | null;
  models: string[];
  builtin: boolean;
  icon: React.ReactNode;
}[] = [
  {
    id: "siliconflow",
    name: "siliconflow",
    desc: "内置服务，即开即用，无需配置",
    badge: "默认",
    models: ["Pro/MiniMaxAI/MiniMax-M2.5", "Pro/deepseek-ai/DeepSeek-V3.2", "Qwen/Qwen3.5-397B-A17B", 'Pro/moonshotai/Kimi-K2.5'],
    builtin: true,
    icon: <SiliconCloud.Color className="size-4" />,
  },
  {
    id: "openai",
    name: "OpenAI",
    desc: "GPT-4o · GPT-4o-mini · o1 系列",
    badge: null,
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1-mini"],
    builtin: false,
    icon: <OpenAI className="size-4" />,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    desc: "deepseek-chat · deepseek-reasoner",
    badge: null,
    models: ["deepseek-chat", "deepseek-reasoner"],
    builtin: false,
    icon: <DeepSeek.Color className="size-4" />,
  },
  {
    id: "custom",
    name: "自定义接口",
    desc: "兼容 OpenAI 协议的任意服务",
    badge: "进阶",
    models: [],
    builtin: false,
    icon: <KeyIcon className="size-4" />,
  },
];

const FONT_SIZES: { id: FontSize; label: string; previewClass: string }[] = [
  { id: "standard", label: "标准", previewClass: "text-sm" },
  { id: "large", label: "大", previewClass: "text-base" },
  { id: "xl", label: "特大", previewClass: "text-lg" },
  { id: "xxl", label: "超大", previewClass: "text-2xl" },
];

// ─── Inline Switch ────────────────────────────────────────────────────────────

function Switch({
  checked,
  onCheckedChange,
  disabled,
  id,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-input",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

// ─── Section Row ──────────────────────────────────────────────────────────────

function SectionRow({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string;
  description?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex-1 space-y-0.5">
        <Label
          htmlFor={htmlFor}
          className="text-sm font-medium cursor-pointer leading-none"
        >
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0 w-full sm:w-auto">{children}</div>
    </div>
  );
}

// ─── Speed Picker ─────────────────────────────────────────────────────────────

function SpeedPicker({
  value,
  onChange,
}: {
  value: VoiceSpeed;
  onChange: (v: VoiceSpeed) => void;
}) {
  const options: { id: VoiceSpeed; label: string }[] = [
    { id: "slow", label: "慢速" },
    { id: "normal", label: "正常" },
    { id: "fast", label: "快速" },
  ];
  return (
    <div className="flex gap-1 rounded-lg border border-border p-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === opt.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function PreferencesClient({
  initialPreferences,
}: {
  initialPreferences: UserPreferencesRow | null;
}) {
  const p = initialPreferences;
  const avatarOptions: {
    id: AvatarIdentifier;
    name: string;
    imageSrc: string;
    description: string;
  }[] = [
    {
      id: "muxin",
      name: "沐心",
      imageSrc: "/muxin.jpg",
      description: "温和亲切，适合更柔和的陪伴氛围。",
    },
    {
      id: "muchen",
      name: "沐辰",
      imageSrc: "/muchen.jpg",
      description: "沉稳清晰，适合更利落的交流体验。",
    },
  ];
  const router = useRouter();
  const pathname = usePathname();

  // ── AI Provider state ────────────────────────────────────────────────────
  const [provider, setProvider] = useState<Provider>(
    (p?.aiProvider as Provider) ?? "siliconflow",
  );
  const [apiKey, setApiKey] = useState(p?.aiApiKey ?? "");
  const [baseUrl, setBaseUrl] = useState(p?.aiBaseUrl ?? "");
  const [model, setModel] = useState(p?.aiModel ?? "mimo-v2-flash");
  const [customModel, setCustomModel] = useState(
    p?.aiProvider === "custom" ? (p?.aiModel ?? "") : "",
  );

  // ── Test-connection state ────────────────────────────────────────────────
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMessage, setTestMessage] = useState("");
  const [testLatency, setTestLatency] = useState<number | null>(null);

  // ── Chat prefs state ─────────────────────────────────────────────────────
  const [personaName, setPersonaName] = useState(p?.personaName ?? "Eveheart");
  const [avatarIdentifier, setAvatarIdentifier] = useState<
    AvatarIdentifier | null
  >(
    p?.avatarIdentifier === "muxin" || p?.avatarIdentifier === "muchen"
      ? p.avatarIdentifier
      : "muxin",
  );
  const [replyLanguage, setReplyLanguage] = useState(
    p?.replyLanguage ?? "zh-CN",
  );
  const [voiceEnabled, setVoiceEnabled] = useState(p?.voiceEnabled ?? true);
  const [voiceSpeed, setVoiceSpeed] = useState<VoiceSpeed>(
    (p?.voiceSpeed as VoiceSpeed) ?? "normal",
  );

  // ── Display state ────────────────────────────────────────────────────────
  const [fontSize, setFontSize] = useState<FontSize>(
    (p?.fontSize as FontSize) ?? "standard",
  );
  const [elderlyMode, setElderlyMode] = useState(p?.elderlyMode ?? false);
  const [highContrast, setHighContrast] = useState(p?.highContrast ?? false);

  // ── Notification state ───────────────────────────────────────────────────
  const [reminderEnabled, setReminderEnabled] = useState(
    p?.reminderEnabled ?? false,
  );
  const [reminderTime, setReminderTime] = useState(p?.reminderTime ?? "20:00");
  const [reminderFreq, setReminderFreq] = useState<ReminderFreq>(
    (p?.reminderFreq as ReminderFreq) ?? "daily",
  );

  // ── Save state ───────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Dirty tracking ───────────────────────────────────────────────────────
  // `committed` mirrors the last-persisted (or initial) values.  Any
  // deviation between the live form state and this snapshot means the form
  // has unsaved changes and the save bar should be visible.
  const [committed, setCommitted] = useState<CommittedPreferencesState>(() => ({
    provider: (p?.aiProvider as Provider) ?? "siliconflow",
    apiKey: p?.aiApiKey ?? "",
    baseUrl: p?.aiBaseUrl ?? "",
    model: p?.aiModel ?? "mimo-v2-flash",
    customModel: p?.aiProvider === "custom" ? (p?.aiModel ?? "") : "",
    personaName: p?.personaName ?? "Eveheart",
    avatarIdentifier:
      p?.avatarIdentifier === "muxin" || p?.avatarIdentifier === "muchen"
        ? p.avatarIdentifier
        : "muxin",
    replyLanguage: p?.replyLanguage ?? "zh-CN",
    voiceEnabled: p?.voiceEnabled ?? true,
    voiceSpeed: (p?.voiceSpeed as VoiceSpeed) ?? "normal",
    fontSize: (p?.fontSize as FontSize) ?? "standard",
    elderlyMode: p?.elderlyMode ?? false,
    highContrast: p?.highContrast ?? false,
    reminderEnabled: p?.reminderEnabled ?? false,
    reminderTime: p?.reminderTime ?? "20:00",
    reminderFreq: (p?.reminderFreq as ReminderFreq) ?? "daily",
  }));

  const isDirty = useMemo(
    () =>
      provider !== committed.provider ||
      apiKey !== committed.apiKey ||
      baseUrl !== committed.baseUrl ||
      model !== committed.model ||
      customModel !== committed.customModel ||
      personaName !== committed.personaName ||
      avatarIdentifier !== committed.avatarIdentifier ||
      replyLanguage !== committed.replyLanguage ||
      voiceEnabled !== committed.voiceEnabled ||
      voiceSpeed !== committed.voiceSpeed ||
      fontSize !== committed.fontSize ||
      elderlyMode !== committed.elderlyMode ||
      highContrast !== committed.highContrast ||
      reminderEnabled !== committed.reminderEnabled ||
      reminderTime !== committed.reminderTime ||
      reminderFreq !== committed.reminderFreq,
    [
      provider, apiKey, baseUrl, model, customModel,
      personaName, avatarIdentifier, replyLanguage, voiceEnabled, voiceSpeed,
      fontSize, elderlyMode, highContrast,
      reminderEnabled, reminderTime, reminderFreq,
      committed,
    ],
  );

  // ── Derived ──────────────────────────────────────────────────────────────
  const currentProvider = PROVIDERS.find((x) => x.id === provider)!;
  const showApiKey = !currentProvider.builtin;
  const showBaseUrl = provider === "custom";
  const showModelSelect = provider !== "custom";
  const showCustomModel = provider === "custom";
  const canTest = currentProvider.builtin || !!apiKey;

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleProviderChange(next: Provider) {
    setProvider(next);
    setTestStatus("idle");
    setTestMessage("");
    setTestLatency(null);
    const cfg = PROVIDERS.find((x) => x.id === next);
    if (cfg?.models.length) setModel(cfg.models[0]);
  }

  async function handleTestConnection() {
    setTestStatus("loading");
    setTestMessage("");
    setTestLatency(null);
    try {
      const res = await fetch("/api/preferences/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey,
          baseUrl,
          model: provider === "custom" ? customModel : model,
        }),
      });
      const data: { success: boolean; message: string; latencyMs?: number } =
        await res.json();
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

    const payload: SavePreferencesInput = {
      aiProvider: provider,
      aiModel: provider === "custom" ? customModel : model,
      aiApiKey: apiKey || null,
      aiBaseUrl: baseUrl || null,
      personaName,
      avatarIdentifier,
      replyLanguage,
      voiceEnabled,
      voiceSpeed,
      fontSize,
      elderlyMode,
      highContrast,
      reminderEnabled,
      reminderTime,
      reminderFreq,
    };

    const result = await savePreferencesAction(payload);
    setIsSaving(false);

    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      // ── Mark current values as committed (clears dirty flag) ───────────────
      setCommitted({
        provider,
        apiKey,
        baseUrl,
        model,
        customModel,
        personaName,
        avatarIdentifier,
        replyLanguage,
        voiceEnabled,
        voiceSpeed,
        fontSize,
        elderlyMode,
        highContrast,
        reminderEnabled,
        reminderTime,
        reminderFreq,
      });
      // ── Route based on elderlyMode state ──────────────────────────────────
      if (elderlyMode) {
        // Mode was just enabled → enter the aging-friendly surface.
        router.push("/aging-friendly/settings");
      } else if (pathname.startsWith("/aging-friendly")) {
        // Mode was disabled from within aging-friendly settings → exit to dashboard.
        router.push("/dashboard/setting/preferences-setting");
      }
    } else {
      setSaveError(result.error ?? "保存失败");
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="p-5 min-h-screen pb-24">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="mb-12">
          <h3 className="font-headline text-4xl font-extrabold text-foreground tracking-tight">
            偏好设置
          </h3>
          <p className="text-muted-foreground mt-2 text-lg">
            自定义 Eveheart 的 AI 服务、对话风格与显示偏好。
          </p>
        </div>

        {/* Section 1: AI 服务配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <BotIcon className="size-5 text-primary" />
              AI 服务配置
            </CardTitle>
            <CardDescription>
              选择为 Eveheart 提供智能对话能力的 AI
              服务商，并配置访问密钥。切换服务商后需重新测试连接。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Provider Cards */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                选择服务商
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PROVIDERS.map((prov) => (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => handleProviderChange(prov.id)}
                    className={cn(
                      "relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
                      "hover:border-primary/50 hover:bg-muted/30",
                      provider === prov.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-transparent",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                        provider === prov.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {prov.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{prov.name}</span>
                        {prov.badge && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                            {prov.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {prov.desc}
                      </p>
                    </div>
                    {provider === prov.id && (
                      <CheckCircle2Icon className="absolute top-3 right-3 size-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Built-in notice + model select */}
            {currentProvider.builtin && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-primary">
                  <CheckCircle2Icon className="size-4 shrink-0" />
                  <span>正在使用 Eveheart 内置服务，无需任何配置。</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    使用模型
                  </Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentProvider.models.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* External provider fields */}
            {showApiKey && (
              <div className="space-y-4">
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      API 密钥
                    </Label>
                    <Input
                      type="password"
                      placeholder="sk-••••••••••••••••"
                      value={apiKey}
                      onChange={(e) => { setApiKey(e.target.value); setTestStatus("idle"); }}
                    />
                    <p className="text-xs text-muted-foreground">
                      密钥加密存储，不会以明文展示或传输。
                    </p>
                  </div>
                  {showModelSelect && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        使用模型
                      </Label>
                      <Select value={model} onValueChange={setModel}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {currentProvider.models.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                {(showBaseUrl || showCustomModel) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {showBaseUrl && (
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Base URL
                        </Label>
                        <Input
                          type="url"
                          placeholder="https://api.example.com/v1"
                          value={baseUrl}
                          onChange={(e) => setBaseUrl(e.target.value)}
                        />
                      </div>
                    )}
                    {showCustomModel && (
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          模型名称
                        </Label>
                        <Input
                          placeholder="例如：llama3-70b-8192"
                          value={customModel}
                          onChange={(e) => setCustomModel(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Test Connection */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testStatus === "loading" || !canTest}
                className="gap-2"
              >
                {testStatus === "loading"
                  ? <Loader2Icon className="size-4 animate-spin" />
                  : <WifiIcon className="size-4" />}
                {testStatus === "loading" ? "测试中…" : "测试连接"}
              </Button>
              {testStatus === "success" && (
                <span className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2Icon className="size-4 shrink-0" />
                  {testMessage}
                  {testLatency !== null && testLatency > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4">{testLatency} ms</Badge>
                  )}
                </span>
              )}
              {testStatus === "error" && (
                <span className="flex items-center gap-2 text-sm text-destructive">
                  <XCircleIcon className="size-4 shrink-0" />
                  {testMessage}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <UserIcon className="size-5 text-primary" />
              数字人形象选择
            </CardTitle>
            <CardDescription>
              选择数字人会话中使用的默认形象，保存后会同步到您的偏好设置。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {avatarOptions.map((option) => {
                const isSelected = avatarIdentifier === option.id;

                return (
                  <Card
                    key={option.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setAvatarIdentifier(option.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setAvatarIdentifier(option.id);
                      }
                    }}
                    className={cn(
                      "cursor-pointer gap-0 border-2 py-0 transition-all",
                      "hover:border-primary/50 hover:bg-muted/20",
                      isSelected && "border-primary bg-primary/5 shadow-sm",
                    )}
                  >
                    <CardHeader className="px-0">
                      <div className="relative aspect-[4/5] w-full overflow-hidden border-b bg-muted">
                        <Image
                          src={option.imageSrc}
                          alt={option.name}
                          fill
                          className="object-cover"
                          sizes="(min-width: 768px) 320px, 100vw"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 px-5 pt-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-semibold">{option.name}</p>
                        <Badge variant={isSelected ? "default" : "secondary"}>
                          {isSelected ? "已选中" : "可选择"}
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {option.description}
                      </p>
                    </CardContent>
                    <CardFooter className="border-t px-5 py-4">
                      <Button
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className="w-full"
                        onClick={(event) => {
                          event.stopPropagation();
                          setAvatarIdentifier(option.id);
                        }}
                      >
                        {isSelected ? "当前形象" : "选择该形象"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: 对话体验偏好 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <MessageCircleIcon className="size-5 text-primary" />
              对话体验偏好
            </CardTitle>
            <CardDescription>
              调整 Eveheart 的对话风格、语音功能与语言偏好。
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <SectionRow label="AI 昵称" description="Eveheart 在对话中使用的自称名字（最多 20 字）" htmlFor="persona-name">
              <Input
                id="persona-name"
                value={personaName}
                onChange={(e) => setPersonaName(e.target.value)}
                className="w-full sm:w-44"
                maxLength={20}
              />
            </SectionRow>
            <SectionRow label="回复语言" description="Eveheart 默认使用的回复语言" htmlFor="reply-language-trigger">
              <Select value={replyLanguage} onValueChange={setReplyLanguage}>
                <SelectTrigger id="reply-language-trigger" className="w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-CN">简体中文</SelectItem>
                  <SelectItem value="zh-TW">繁體中文</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="auto">跟随用户语言</SelectItem>
                </SelectContent>
              </Select>
            </SectionRow>
            <SectionRow label="语音功能" description="启用后，Eveheart 可朗读对话内容（需浏览器支持 TTS）" htmlFor="voice-switch">
              <Switch id="voice-switch" checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
            </SectionRow>
            {voiceEnabled && (
              <SectionRow label="语音语速" description="调整 Eveheart 语音朗读的速度">
                <SpeedPicker value={voiceSpeed} onChange={setVoiceSpeed} />
              </SectionRow>
            )}
          </CardContent>
        </Card>

        {/* Section 3: 显示与无障碍 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <MonitorIcon className="size-5 text-primary" />
              显示与无障碍
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className={cn(
              "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border-2 p-5 transition-all",
              elderlyMode ? "border-primary bg-primary/5" : "border-border",
            )}>
              <div className="flex items-start gap-3 flex-1">
                <UserIcon className={cn("size-7 shrink-0 mt-0.5", elderlyMode ? "text-primary" : "text-muted-foreground")} />
                <div className="space-y-1">
                  <p className="font-semibold text-sm">适老化模式</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    启用后自动切换到适老化模式
                  </p>
                  {elderlyMode && <Badge className="mt-1 text-[10px] h-4">已启用 · 保存更改后将进入适老化模式</Badge>}
                </div>
              </div>
              <Switch
                checked={elderlyMode}
                onCheckedChange={(v) => { setElderlyMode(v); if (v) setFontSize("xxl"); }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: 情绪追踪提醒 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <BellIcon className="size-5 text-primary" />
              情绪追踪提醒
            </CardTitle>
            <CardDescription>
              设置定期情绪检入提醒，帮助您坚持情绪健康记录习惯。
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <SectionRow label="启用定期提醒" description="在指定时间发送通知，提醒您与 Eveheart 进行情绪检入" htmlFor="reminder-switch">
              <Switch id="reminder-switch" checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
            </SectionRow>
            {reminderEnabled && (
              <SectionRow label="提醒时间" description="每天在此时间发送提醒通知" htmlFor="reminder-time">
                <Input
                  id="reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full sm:w-32"
                />
              </SectionRow>
            )}
            {reminderEnabled && (
              <SectionRow label="提醒频率" description="决定以何种频率接收提醒" htmlFor="reminder-freq-trigger">
                <Select value={reminderFreq} onValueChange={(v) => setReminderFreq(v as ReminderFreq)}>
                  <SelectTrigger id="reminder-freq-trigger" className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">每天</SelectItem>
                    <SelectItem value="weekdays">工作日</SelectItem>
                    <SelectItem value="weekly">每周一次</SelectItem>
                  </SelectContent>
                </Select>
              </SectionRow>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Floating Save Bar — only visible when the form has unsaved changes */}
      {(isDirty || saveError) && (
        <div className="fixed bottom-0 right-0 inset-x-0 z-50 border-t border-border bg-background/80 backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200">
          <div className="max-w-4xl mx-auto px-5 py-3 flex items-center gap-4">
            <p className="text-sm text-muted-foreground hidden sm:block flex-1">
              您有未保存的更改，保存后立即生效。
            </p>
            <div className="flex items-center gap-3 ml-auto">
              {saveError && (
                <span className="flex items-center gap-1.5 text-sm text-destructive">
                  <XCircleIcon className="size-4" />
                  {saveError}
                </span>
              )}
              {saveSuccess && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2Icon className="size-4" />
                  保存成功
                </span>
              )}
              <Button onClick={handleSave} disabled={isSaving} className="gap-2 px-6">
                {isSaving ? <Loader2Icon className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
                {isSaving ? "保存中…" : "保存设置"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
