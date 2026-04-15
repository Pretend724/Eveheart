"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckIcon,
  HeartPulseIcon,
  MailIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  inviteFamilyMemberAction,
  removeFamilyRelationshipAction,
  respondToFamilyInviteAction,
  sendEmotionUpdateNotificationAction,
  sendFamilyMessageAction,
} from "@/lib/actions/family-notifications";
import { cn } from "@/lib/utils";

type FamilyManagementSectionProps = {
  preferences: {
    elderlyMode: boolean;
    highContrast: boolean;
  };
  invitedFamilyMembers: Array<{
    relationshipId: string;
    familyMemberId: string;
    name: string | null;
    email: string;
    image: string | null;
    confirmedAt: string | null;
  }>;
  pendingInvites: Array<{
    relationshipId: string;
    elderId: string;
    elderName: string | null;
    elderEmail: string;
    elderImage: string | null;
    createdAt: string;
  }>;
  connectedElders: Array<{
    relationshipId: string;
    elderId: string;
    elderName: string | null;
    elderEmail: string;
    elderImage: string | null;
    confirmedAt: string | null;
  }>;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "待确认";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function FamilyManagementSection({
  preferences,
  invitedFamilyMembers,
  pendingInvites,
  connectedElders,
}: FamilyManagementSectionProps) {
  const router = useRouter();
  const [inviteQuery, setInviteQuery] = React.useState("");
  const [messageDrafts, setMessageDrafts] = React.useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = React.useState<string | null>(null);

  const accessibilityClass = cn(
    preferences.elderlyMode && "text-base",
    preferences.highContrast && "ring-1 ring-border",
  );

  async function runAction(
    key: string,
    task: () => Promise<{ success: boolean; message: string }>,
    options?: {
      resetInvite?: boolean;
      resetDraftKey?: string;
    },
  ) {
    setBusyKey(key);

    try {
      const result = await task();
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      if (options?.resetInvite) {
        setInviteQuery("");
      }
      if (options?.resetDraftKey) {
        setMessageDrafts((current) => ({
          ...current,
          [options.resetDraftKey!]: "",
        }));
      }

      toast.success(result.message);
      router.refresh();
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={cn("rounded-2xl border bg-muted/20 p-5", accessibilityClass)}>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <UsersIcon />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold">家属管理与授权</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              长者可通过用户名或邮箱邀请家属完成绑定。家属接受后，才可以查看已授权的情绪概览，并接收留言或提醒通知。
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium">
              发送家属绑定邀请
            </label>
            <Input
              value={inviteQuery}
              onChange={(event) => setInviteQuery(event.target.value)}
              placeholder="输入家属用户名或邮箱"
              className={preferences.elderlyMode ? "h-11 text-base" : undefined}
            />
          </div>
          <Button
            className="lg:min-w-40"
            disabled={!inviteQuery.trim() || busyKey === "invite"}
            onClick={() =>
              void runAction(
                "invite",
                () => inviteFamilyMemberAction({ query: inviteQuery }),
                { resetInvite: true },
              )
            }
          >
            <UserPlusIcon data-icon="inline-start" />
            发送邀请
          </Button>
        </div>
      </div>

      <section className="rounded-2xl border p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold">我邀请的家属</h4>
            <p className="text-sm text-muted-foreground">
              已确认的家属可接收情绪提醒与留言通知。
            </p>
          </div>
          <Badge variant="secondary">{invitedFamilyMembers.length}</Badge>
        </div>

        <div className="flex flex-col gap-4">
          {invitedFamilyMembers.length > 0 ? (
            invitedFamilyMembers.map((member) => {
              const draft = messageDrafts[member.relationshipId] ?? "";
              const name = member.name ?? member.email;

              return (
                <div
                  key={member.relationshipId}
                  className={cn("rounded-2xl border bg-background p-4", accessibilityClass)}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-11">
                        <AvatarImage src={member.image ?? ""} alt={name} />
                        <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{name}</p>
                          <Badge>已绑定</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <p className="text-xs text-muted-foreground">
                          确认时间：{formatDateTime(member.confirmedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyKey === `emotion-${member.relationshipId}`}
                        onClick={() =>
                          void runAction(
                            `emotion-${member.relationshipId}`,
                            () =>
                              sendEmotionUpdateNotificationAction({
                                relationshipId: member.relationshipId,
                              }),
                          )
                        }
                      >
                        <HeartPulseIcon data-icon="inline-start" />
                        推送情绪概览
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyKey === `unbind-${member.relationshipId}`}
                        onClick={() =>
                          void runAction(`unbind-${member.relationshipId}`, () =>
                            removeFamilyRelationshipAction({
                              relationshipId: member.relationshipId,
                            }),
                          )
                        }
                      >
                        <Trash2Icon data-icon="inline-start" />
                        解绑
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <Textarea
                      value={draft}
                      onChange={(event) =>
                        setMessageDrafts((current) => ({
                          ...current,
                          [member.relationshipId]: event.target.value,
                        }))
                      }
                      placeholder="给家属留一句近况说明或照护提醒"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        disabled={!draft.trim() || busyKey === `message-${member.relationshipId}`}
                        onClick={() =>
                          void runAction(
                            `message-${member.relationshipId}`,
                            () =>
                              sendFamilyMessageAction({
                                relationshipId: member.relationshipId,
                                message: draft,
                              }),
                            { resetDraftKey: member.relationshipId },
                          )
                        }
                      >
                        <MailIcon data-icon="inline-start" />
                        发送留言
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
              暂无已绑定家属。邀请被接受后，这里会展示家属列表和授权操作。
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold">待处理的家属邀请</h4>
            <p className="text-sm text-muted-foreground">
              家属账号在确认前无法查看长者的 EmotionLog 数据。
            </p>
          </div>
          <Badge variant="secondary">{pendingInvites.length}</Badge>
        </div>

        <div className="flex flex-col gap-4">
          {pendingInvites.length > 0 ? (
            pendingInvites.map((invite) => {
              const name = invite.elderName ?? invite.elderEmail;

              return (
                <div
                  key={invite.relationshipId}
                  className={cn("rounded-2xl border bg-background p-4", accessibilityClass)}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-11">
                        <AvatarImage src={invite.elderImage ?? ""} alt={name} />
                        <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{name}</p>
                          <Badge variant="outline">待确认</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{invite.elderEmail}</p>
                        <p className="text-xs text-muted-foreground">
                          邀请时间：{formatDateTime(invite.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={busyKey === `accept-${invite.relationshipId}`}
                        onClick={() =>
                          void runAction(`accept-${invite.relationshipId}`, () =>
                            respondToFamilyInviteAction({
                              relationshipId: invite.relationshipId,
                              decision: "accept",
                            }),
                          )
                        }
                      >
                        <CheckIcon data-icon="inline-start" />
                        接受授权
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyKey === `reject-${invite.relationshipId}`}
                        onClick={() =>
                          void runAction(`reject-${invite.relationshipId}`, () =>
                            respondToFamilyInviteAction({
                              relationshipId: invite.relationshipId,
                              decision: "reject",
                            }),
                          )
                        }
                      >
                        <XIcon data-icon="inline-start" />
                        暂不接受
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
              当前没有待处理邀请。
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold">我已关注的长者</h4>
            <p className="text-sm text-muted-foreground">
              接受邀请后，您会在通知中心收到长者共享的情绪状况更新。
            </p>
          </div>
          <Badge variant="secondary">{connectedElders.length}</Badge>
        </div>

        <div className="flex flex-col gap-4">
          {connectedElders.length > 0 ? (
            connectedElders.map((elder) => {
              const draft = messageDrafts[elder.relationshipId] ?? "";
              const name = elder.elderName ?? elder.elderEmail;

              return (
                <div
                  key={elder.relationshipId}
                  className={cn("rounded-2xl border bg-background p-4", accessibilityClass)}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-11">
                        <AvatarImage src={elder.elderImage ?? ""} alt={name} />
                        <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{name}</p>
                          <Badge>已授权</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{elder.elderEmail}</p>
                        <p className="text-xs text-muted-foreground">
                          生效时间：{formatDateTime(elder.confirmedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyKey === `unlink-${elder.relationshipId}`}
                        onClick={() =>
                          void runAction(`unlink-${elder.relationshipId}`, () =>
                            removeFamilyRelationshipAction({
                              relationshipId: elder.relationshipId,
                            }),
                          )
                        }
                      >
                        <Trash2Icon data-icon="inline-start" />
                        解除绑定
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <Textarea
                      value={draft}
                      onChange={(event) =>
                        setMessageDrafts((current) => ({
                          ...current,
                          [elder.relationshipId]: event.target.value,
                        }))
                      }
                      placeholder="给长者发送一句留言，消息会出现在对方通知中心"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        disabled={!draft.trim() || busyKey === `note-${elder.relationshipId}`}
                        onClick={() =>
                          void runAction(
                            `note-${elder.relationshipId}`,
                            () =>
                              sendFamilyMessageAction({
                                relationshipId: elder.relationshipId,
                                message: draft,
                              }),
                            { resetDraftKey: elder.relationshipId },
                          )
                        }
                      >
                        <MailIcon data-icon="inline-start" />
                        留言给长者
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
              暂未绑定长者账号。接受邀请后，这里会显示已关注长者，并通过通知中心查看情绪更新。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
