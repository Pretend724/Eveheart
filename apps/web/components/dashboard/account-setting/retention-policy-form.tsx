"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateRetentionPolicyAction,
  type UpdateRetentionPolicyActionState,
} from "@/lib/actions/account-setting";

const retentionPolicyOptions = [
  { value: "ONE_YEAR", label: "保留 1 年" },
  { value: "SIX_MONTHS", label: "保留 6 个月" },
  { value: "MANUAL_ONLY", label: "仅手动删除" },
  { value: "THIRTY_DAYS", label: "30 天后自动删除" },
] as const;

type RetentionPolicyValue = (typeof retentionPolicyOptions)[number]["value"];

type RetentionPolicyFormProps = {
  initialRetentionPolicy: RetentionPolicyValue;
};

const initialState: UpdateRetentionPolicyActionState = {
  error: "",
  success: "",
};

function SaveRetentionPolicyButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full py-3 h-auto font-medium"
    >
      {pending ? "保存中..." : "保存策略"}
    </Button>
  );
}

export function RetentionPolicyForm({
  initialRetentionPolicy,
}: RetentionPolicyFormProps) {
  const [state, formAction] = useActionState(
    updateRetentionPolicyAction,
    initialState,
  );
  const [retentionPolicy, setRetentionPolicy] = useState<RetentionPolicyValue>(
    initialRetentionPolicy,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          数据保留策略
        </Label>
        <input type="hidden" name="retentionPolicy" value={retentionPolicy} />
        <Select
          value={retentionPolicy}
          onValueChange={(value) =>
            setRetentionPolicy(value as RetentionPolicyValue)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="请选择数据保留策略" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {retentionPolicyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Eveheart 会在你选择的周期内保存对话记录，用于生成更连贯的情绪洞察。
        </p>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">{state.success}</p>
      ) : null}

      {retentionPolicy !== initialRetentionPolicy ? (
        <SaveRetentionPolicyButton />
      ) : null}
    </form>
  );
}
