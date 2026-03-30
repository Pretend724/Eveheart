"use client";

import { UserXIcon } from "lucide-react";
import { startTransition, useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  deleteAccountAction,
  type DeleteAccountActionState,
} from "@/lib/actions/account-setting";

const initialState: DeleteAccountActionState = {
  error: "",
};

export function DeleteAccountAction() {
  const [state, deleteAction, isPending] = useActionState(
    deleteAccountAction,
    initialState,
  );

  return (
    <div className="flex w-full flex-col gap-2 md:w-auto">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="destructive"
            className="w-full px-6 py-3 h-auto font-bold"
          >
            注销账户
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <UserXIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>确认注销账户？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销。你的情绪模式、对话历史与洞察数据会被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                startTransition(() => {
                  deleteAction();
                });
              }}
            >
              {isPending ? "注销中..." : "确认注销"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
    </div>
  );
}
