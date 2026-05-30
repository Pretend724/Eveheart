"use client";

import {
  BotIcon,
  CheckCircle2Icon,
  Loader2Icon,
  WifiIcon,
  XCircleIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
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
import { cn } from "@/lib/utils";
import { PROVIDERS } from "../_lib/preferences-data";
import type { Provider, TestStatus } from "../_lib/preferences-types";

export function AIServiceSection({
  provider,
  apiKey,
  baseUrl,
  model,
  customModel,
  testStatus,
  testMessage,
  testLatency,
  onProviderChange,
  onApiKeyChange,
  onBaseUrlChange,
  onModelChange,
  onCustomModelChange,
  onTestConnection,
}: {
  provider: Provider;
  apiKey: string;
  baseUrl: string;
  model: string;
  customModel: string;
  testStatus: TestStatus;
  testMessage: string;
  testLatency: number | null;
  onProviderChange: (provider: Provider) => void;
  onApiKeyChange: (value: string) => void;
  onBaseUrlChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onCustomModelChange: (value: string) => void;
  onTestConnection: () => void;
}) {
  const currentProvider = PROVIDERS.find((item) => item.id === provider)!;
  const showApiKey = !currentProvider.builtin;
  const showBaseUrl = provider === "custom";
  const showModelSelect = provider !== "custom";
  const showCustomModel = provider === "custom";
  const canTest = currentProvider.builtin || !!apiKey;

  return (
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
        <ProviderPicker
          provider={provider}
          onProviderChange={onProviderChange}
        />

        {currentProvider.builtin && (
          <BuiltinProviderFields
            model={model}
            models={currentProvider.models}
            onModelChange={onModelChange}
          />
        )}

        {showApiKey && (
          <ExternalProviderFields
            apiKey={apiKey}
            baseUrl={baseUrl}
            model={model}
            customModel={customModel}
            models={currentProvider.models}
            showBaseUrl={showBaseUrl}
            showModelSelect={showModelSelect}
            showCustomModel={showCustomModel}
            onApiKeyChange={onApiKeyChange}
            onBaseUrlChange={onBaseUrlChange}
            onModelChange={onModelChange}
            onCustomModelChange={onCustomModelChange}
          />
        )}

        <ConnectionTestStatus
          canTest={canTest}
          testStatus={testStatus}
          testMessage={testMessage}
          testLatency={testLatency}
          onTestConnection={onTestConnection}
        />
      </CardContent>
    </Card>
  );
}

function ProviderPicker({
  provider,
  onProviderChange,
}: {
  provider: Provider;
  onProviderChange: (provider: Provider) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        选择服务商
      </Label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PROVIDERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onProviderChange(item.id)}
            className={cn(
              "relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
              "hover:border-primary/50 hover:bg-muted/30",
              provider === item.id
                ? "border-primary bg-primary/5"
                : "border-border bg-transparent",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                provider === item.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {item.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{item.name}</span>
                {item.badge && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {item.desc}
              </p>
            </div>
            {provider === item.id && (
              <CheckCircle2Icon className="absolute right-3 top-3 size-4 shrink-0 text-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function BuiltinProviderFields({
  model,
  models,
  onModelChange,
}: {
  model: string;
  models: string[];
  onModelChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
        <CheckCircle2Icon className="size-4 shrink-0" />
        <span>正在使用 Eveheart 内置服务，无需任何配置。</span>
      </div>
      <ModelSelect model={model} models={models} onModelChange={onModelChange} />
    </div>
  );
}

function ExternalProviderFields({
  apiKey,
  baseUrl,
  model,
  customModel,
  models,
  showBaseUrl,
  showModelSelect,
  showCustomModel,
  onApiKeyChange,
  onBaseUrlChange,
  onModelChange,
  onCustomModelChange,
}: {
  apiKey: string;
  baseUrl: string;
  model: string;
  customModel: string;
  models: string[];
  showBaseUrl: boolean;
  showModelSelect: boolean;
  showCustomModel: boolean;
  onApiKeyChange: (value: string) => void;
  onBaseUrlChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onCustomModelChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Separator />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            API 密钥
          </Label>
          <Input
            type="password"
            placeholder="sk-••••••••••••••••"
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            密钥加密存储，不会以明文展示或传输。
          </p>
        </div>

        {showModelSelect && (
          <ModelSelect
            model={model}
            models={models}
            onModelChange={onModelChange}
          />
        )}
      </div>

      {(showBaseUrl || showCustomModel) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {showBaseUrl && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Base URL
              </Label>
              <Input
                type="url"
                placeholder="https://api.example.com/v1"
                value={baseUrl}
                onChange={(event) => onBaseUrlChange(event.target.value)}
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
                onChange={(event) => onCustomModelChange(event.target.value)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ModelSelect({
  model,
  models,
  onModelChange,
}: {
  model: string;
  models: string[];
  onModelChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        使用模型
      </Label>
      <Select value={model} onValueChange={onModelChange}>
        <SelectTrigger className="max-w-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {models.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ConnectionTestStatus({
  canTest,
  testStatus,
  testMessage,
  testLatency,
  onTestConnection,
}: {
  canTest: boolean;
  testStatus: TestStatus;
  testMessage: string;
  testLatency: number | null;
  onTestConnection: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3 pt-1 sm:flex-row sm:items-center">
      <Button
        variant="outline"
        onClick={onTestConnection}
        disabled={testStatus === "loading" || !canTest}
        className="gap-2"
      >
        {testStatus === "loading" ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <WifiIcon className="size-4" />
        )}
        {testStatus === "loading" ? "测试中…" : "测试连接"}
      </Button>

      {testStatus === "success" && (
        <span className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2Icon className="size-4 shrink-0" />
          {testMessage}
          {testLatency !== null && testLatency > 0 && (
            <Badge variant="secondary" className="h-4 text-[10px]">
              {testLatency} ms
            </Badge>
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
  );
}
