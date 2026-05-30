"use client";

import { MessageCircleIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PreferenceSwitch } from "./preference-switch";
import { SectionRow } from "./section-row";
import { SpeedPicker } from "./speed-picker";
import type { VoiceSpeed } from "../_lib/preferences-types";

export function ChatExperienceSection({
  personaName,
  replyLanguage,
  voiceEnabled,
  voiceSpeed,
  onPersonaNameChange,
  onReplyLanguageChange,
  onVoiceEnabledChange,
  onVoiceSpeedChange,
}: {
  personaName: string;
  replyLanguage: string;
  voiceEnabled: boolean;
  voiceSpeed: VoiceSpeed;
  onPersonaNameChange: (value: string) => void;
  onReplyLanguageChange: (value: string) => void;
  onVoiceEnabledChange: (value: boolean) => void;
  onVoiceSpeedChange: (value: VoiceSpeed) => void;
}) {
  return (
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
        <SectionRow
          label="AI 昵称"
          description="Eveheart 在对话中使用的自称名字（最多 20 字）"
          htmlFor="persona-name"
        >
          <Input
            id="persona-name"
            value={personaName}
            onChange={(event) => onPersonaNameChange(event.target.value)}
            className="w-full sm:w-44"
            maxLength={20}
          />
        </SectionRow>

        <SectionRow
          label="回复语言"
          description="Eveheart 默认使用的回复语言"
          htmlFor="reply-language-trigger"
        >
          <Select value={replyLanguage} onValueChange={onReplyLanguageChange}>
            <SelectTrigger
              id="reply-language-trigger"
              className="w-full sm:w-44"
            >
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

        <SectionRow
          label="语音功能"
          description="启用后，Eveheart 可朗读对话内容（需浏览器支持 TTS）"
          htmlFor="voice-switch"
        >
          <PreferenceSwitch
            id="voice-switch"
            checked={voiceEnabled}
            onCheckedChange={onVoiceEnabledChange}
          />
        </SectionRow>

        {voiceEnabled && (
          <SectionRow label="语音语速" description="调整 Eveheart 语音朗读的速度">
            <SpeedPicker value={voiceSpeed} onChange={onVoiceSpeedChange} />
          </SectionRow>
        )}
      </CardContent>
    </Card>
  );
}
