"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updatePasswordAction,
  type UpdatePasswordActionState,
} from "@/lib/actions/account-setting";

const initialState: UpdatePasswordActionState = {
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

export function PasswordForm() {
  const [state, formAction] = useActionState(
    updatePasswordAction,
    initialState,
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!state.success) {
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            当前密码
          </Label>
          <Input
            type="password"
            name="currentPassword"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            新密码
          </Label>
          <Input
            type="password"
            name="newPassword"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            确认密码
          </Label>
          <Input
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="••••••••"
          />
        </div>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">{state.success}</p>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
