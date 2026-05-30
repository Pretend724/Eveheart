"use client";

import { BellIcon } from "lucide-react";
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
import type { ReminderFreq } from "../_lib/preferences-types";

export function ReminderSection({
  reminderEnabled,
  reminderTime,
  reminderFreq,
  onReminderEnabledChange,
  onReminderTimeChange,
  onReminderFreqChange,
}: {
  reminderEnabled: boolean;
  reminderTime: string;
  reminderFreq: ReminderFreq;
  onReminderEnabledChange: (value: boolean) => void;
  onReminderTimeChange: (value: string) => void;
  onReminderFreqChange: (value: ReminderFreq) => void;
}) {
  return (
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
        <SectionRow
          label="启用定期提醒"
          description="在指定时间发送通知，提醒您与 Eveheart 进行情绪检入"
          htmlFor="reminder-switch"
        >
          <PreferenceSwitch
            id="reminder-switch"
            checked={reminderEnabled}
            onCheckedChange={onReminderEnabledChange}
          />
        </SectionRow>

        {reminderEnabled && (
          <SectionRow
            label="提醒时间"
            description="每天在此时间发送提醒通知"
            htmlFor="reminder-time"
          >
            <Input
              id="reminder-time"
              type="time"
              value={reminderTime}
              onChange={(event) => onReminderTimeChange(event.target.value)}
              className="w-full sm:w-32"
            />
          </SectionRow>
        )}

        {reminderEnabled && (
          <SectionRow
            label="提醒频率"
            description="决定以何种频率接收提醒"
            htmlFor="reminder-freq-trigger"
          >
            <Select
              value={reminderFreq}
              onValueChange={(value) =>
                onReminderFreqChange(value as ReminderFreq)
              }
            >
              <SelectTrigger
                id="reminder-freq-trigger"
                className="w-full sm:w-32"
              >
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
  );
}
