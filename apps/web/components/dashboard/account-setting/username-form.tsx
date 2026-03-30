"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateUsernameAction,
  type UpdateUsernameActionState,
} from "@/lib/actions/account-setting";

type UsernameFormProps = {
  initialName: string;
  email: string;
};

const initialState: UpdateUsernameActionState = {
  error: "",
  success: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="px-8 py-3 font-bold shadow-lg shadow-primary/20"
    >
      {pending ? "保存中..." : "保存更改"}
    </Button>
  );
}

export function UsernameForm({ initialName, email }: UsernameFormProps) {
  const [state, formAction] = useActionState(
    updateUsernameAction,
    initialState,
  );
  const [name, setName] = useState(initialName);
  const hasChanged = name !== initialName;

  return (
    <form action={formAction} className="flex-1 w-full">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              用户名
            </Label>
            <Input
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="请输入用户名"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              邮箱
            </Label>
            <Input disabled defaultValue={email} placeholder={email} />
          </div>
        </div>

        {state.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-emerald-600">{state.success}</p>
        ) : null}

        {hasChanged ? (
          <div className="flex justify-end">
            <SubmitButton />
          </div>
        ) : null}
      </div>
    </form>
  );
}
