"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  BellIcon,
  CheckCheckIcon,
  HeartPulseIcon,
  Loader2Icon,
  MailIcon,
  ShieldAlertIcon,
  UsersIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { markNotificationReadAction } from "@/lib/actions/family-notifications";
import { cn } from "@/lib/utils";
import type {
  EmotionSnapshot,
  NotificationRecord,
  NotificationsResponse,
} from "@/schemas/family-notifications";

type NotificationPreferences = NotificationsResponse["preferences"];

type NotificationCenterContextValue = {
  notifications: NotificationRecord[];
  unreadCount: number;
  quietHoursActive: boolean;
  preferences: NotificationPreferences;
  open: boolean;
  selectedNotificationId: string | null;
  selectedNotification: NotificationRecord | null;
  isLoading: boolean;
  openNotificationCenter: (notificationId?: string | null) => void;
  closeNotificationCenter: () => void;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  setSelectedNotificationId: (notificationId: string | null) => void;
};

const NotificationCenterContext =
  React.createContext<NotificationCenterContextValue | null>(null);

function getNotificationIcon(type: NotificationRecord["type"]) {
  switch (type) {
    case "EMOTION_STATUS_UPDATE":
      return HeartPulseIcon;
    case "FAMILY_MESSAGE":
      return MailIcon;
    case "FAMILY_INVITE":
    case "FAMILY_INVITE_ACCEPTED":
    case "FAMILY_INVITE_REJECTED":
      return UsersIcon;
    default:
      return ShieldAlertIcon;
  }
}

function getPayloadString(
  payload: NotificationRecord["payload"],
  key: string,
): string | null {
  const value = payload?.[key];
  return typeof value === "string" ? value : null;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function notificationTone(type: NotificationRecord["type"]) {
  if (type === "EMOTION_STATUS_UPDATE") {
    return "border-primary/30 bg-primary/5";
  }

  if (type === "FAMILY_MESSAGE") {
    return "border-border bg-muted/40";
  }

  return "border-border bg-background";
}

function useNotificationCenterValue() {
  const context = React.useContext(NotificationCenterContext);
  if (!context) {
    throw new Error(
      "useNotificationCenter must be used within NotificationCenterProvider.",
    );
  }

  return context;
}

async function fetchNotificationsFromApi() {
  const response = await fetch("/api/notifications?take=30", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("无法获取通知列表。");
  }

  return (await response.json()) as NotificationsResponse;
}

export function NotificationCenterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [notifications, setNotifications] = React.useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [quietHoursActive, setQuietHoursActive] = React.useState(false);
  const [preferences, setPreferences] = React.useState<NotificationPreferences>({
    elderlyMode: false,
    highContrast: false,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
  });
  const [open, setOpen] = React.useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = React.useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = React.useState(true);

  const hasHydratedRef = React.useRef(false);
  const knownNotificationIdsRef = React.useRef<Set<string>>(new Set());

  const refreshNotifications = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetchNotificationsFromApi();

      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
      setQuietHoursActive(response.quietHoursActive);
      setPreferences(response.preferences);

      const latestIds = new Set(response.notifications.map((item) => item.id));
      const unseenUnreadNotifications = response.notifications.filter(
        (item) => !item.isRead && !knownNotificationIdsRef.current.has(item.id),
      );

      if (hasHydratedRef.current && !response.quietHoursActive) {
        unseenUnreadNotifications
          .slice()
          .reverse()
          .forEach((notification) => {
            toast(notification.title, {
              description: notification.summary,
              action: {
                label: "查看",
                onClick: () => {
                  setSelectedNotificationId(notification.id);
                  setOpen(true);
                },
              },
            });
          });
      }

      knownNotificationIdsRef.current = latestIds;
      hasHydratedRef.current = true;
    } catch (error) {
      if (hasHydratedRef.current) {
        console.error("[notifications]", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshNotifications();
  }, [pathname, refreshNotifications]);

  React.useEffect(() => {
    const handleFocus = () => {
      void refreshNotifications();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshNotifications();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshNotifications]);

  const markAsRead = React.useCallback(
    async (notificationId: string) => {
      const target = notifications.find((item) => item.id === notificationId);
      if (!target || target.isRead) {
        return;
      }

      const result = await markNotificationReadAction({ notificationId });
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : item,
        ),
      );
      setUnreadCount((current) => Math.max(current - 1, 0));
    },
    [notifications],
  );

  const openNotificationCenter = React.useCallback(
    (notificationId?: string | null) => {
      if (notificationId) {
        setSelectedNotificationId(notificationId);
      } else {
        setSelectedNotificationId((current) => current ?? notifications[0]?.id ?? null);
      }

      setOpen(true);
    },
    [notifications],
  );

  const closeNotificationCenter = React.useCallback(() => {
    setOpen(false);
  }, []);

  const selectedNotification = React.useMemo(
    () =>
      notifications.find((item) => item.id === selectedNotificationId) ??
      notifications[0] ??
      null,
    [notifications, selectedNotificationId],
  );

  React.useEffect(() => {
    if (open && selectedNotification && !selectedNotification.isRead) {
      void markAsRead(selectedNotification.id);
    }
  }, [open, selectedNotification, markAsRead]);

  const value = React.useMemo<NotificationCenterContextValue>(
    () => ({
      notifications,
      unreadCount,
      quietHoursActive,
      preferences,
      open,
      selectedNotificationId,
      selectedNotification,
      isLoading,
      openNotificationCenter,
      closeNotificationCenter,
      refreshNotifications,
      markAsRead,
      setSelectedNotificationId,
    }),
    [
      notifications,
      unreadCount,
      quietHoursActive,
      preferences,
      open,
      selectedNotificationId,
      selectedNotification,
      isLoading,
      openNotificationCenter,
      closeNotificationCenter,
      refreshNotifications,
      markAsRead,
    ],
  );

  return (
    <NotificationCenterContext.Provider value={value}>
      {children}
      <NotificationCenterDrawer />
    </NotificationCenterContext.Provider>
  );
}

export function useNotificationCenter() {
  return useNotificationCenterValue();
}

function NotificationCenterDrawer() {
  const {
    notifications,
    unreadCount,
    preferences,
    open,
    closeNotificationCenter,
    selectedNotification,
    selectedNotificationId,
    setSelectedNotificationId,
    isLoading,
    markAsRead,
  } = useNotificationCenterValue();

  const [emotionSnapshot, setEmotionSnapshot] = React.useState<EmotionSnapshot | null>(
    null,
  );
  const [emotionLoading, setEmotionLoading] = React.useState(false);
  const [emotionError, setEmotionError] = React.useState<string | null>(null);

  const denseText = preferences.elderlyMode ? "text-base" : "text-sm";
  const panelContrast = preferences.highContrast ? "ring-1 ring-border" : "";

  React.useEffect(() => {
    const elderId =
      selectedNotification?.type === "EMOTION_STATUS_UPDATE"
        ? getPayloadString(selectedNotification.payload, "elderId")
        : null;

    if (!elderId) {
      setEmotionSnapshot(null);
      setEmotionError(null);
      return;
    }

    const abortController = new AbortController();

    async function loadEmotionSnapshot() {
      setEmotionLoading(true);
      setEmotionError(null);

      try {
        const response = await fetch(`/api/family/emotion/${elderId}`, {
          method: "GET",
          signal: abortController.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("暂时无法读取情绪概览。");
        }

        const payload = (await response.json()) as EmotionSnapshot;
        setEmotionSnapshot(payload);
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("[emotion-snapshot]", error);
          setEmotionError("暂时无法读取情绪概览，请稍后再试。");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setEmotionLoading(false);
        }
      }
    }

    void loadEmotionSnapshot();

    return () => {
      abortController.abort();
    };
  }, [selectedNotification]);

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => (nextOpen ? undefined : closeNotificationCenter())}>
      <SheetContent
        side="right"
        className={cn("w-full sm:max-w-3xl", preferences.elderlyMode && "sm:max-w-4xl")}
      >
        <SheetHeader className="pb-0">
          <SheetTitle className={cn("flex items-center gap-2", preferences.elderlyMode && "text-xl")}>
            <BellIcon />
            通知中心
            {unreadCount > 0 ? <Badge>{unreadCount}</Badge> : null}
          </SheetTitle>
          <SheetDescription>
            这里会汇总家属绑定、留言提醒与情绪状况更新。
          </SheetDescription>
        </SheetHeader>

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[0.95fr_1.05fr]">
          <div className={cn("flex min-h-0 flex-col border-b lg:border-r lg:border-b-0", panelContrast)}>
            <div className="flex items-center justify-between px-4 py-3">
              <div className={cn("font-medium", preferences.elderlyMode && "text-base")}>
                最近通知
              </div>
              {isLoading ? (
                <Loader2Icon className="animate-spin text-muted-foreground" />
              ) : null}
            </div>
            <Separator />
            <ScrollArea className="min-h-0 flex-1">
              <div className="flex flex-col gap-2 p-3">
                {notifications.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
                    暂无通知，后续的绑定邀请和情绪更新会出现在这里。
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);

                    return (
                      <button
                        key={notification.id}
                        type="button"
                        className={cn(
                          "flex w-full flex-col gap-3 rounded-2xl border p-4 text-left transition-colors hover:bg-muted/60",
                          notificationTone(notification.type),
                          notification.id === selectedNotificationId && "ring-2 ring-primary/30",
                          !notification.isRead && "shadow-sm",
                          preferences.highContrast && "border-foreground/20",
                        )}
                        onClick={() => {
                          setSelectedNotificationId(notification.id);
                          if (!notification.isRead) {
                            void markAsRead(notification.id);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-background/80 p-2 text-primary">
                            <Icon />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className={cn("truncate font-medium", denseText)}>
                                {notification.title}
                              </p>
                              {!notification.isRead ? (
                                <Badge variant="secondary">未读</Badge>
                              ) : null}
                            </div>
                            <p className={cn("mt-1 line-clamp-2 text-muted-foreground", denseText)}>
                              {notification.summary}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatTime(notification.createdAt)}</span>
                          <span>{notification.sender?.name ?? notification.sender?.email ?? "系统"}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="px-4 py-3">
              <div className={cn("font-medium", preferences.elderlyMode && "text-base")}>
                通知详情
              </div>
            </div>
            <Separator />
            <ScrollArea className="min-h-0 flex-1">
              {selectedNotification ? (
                <div className="flex flex-col gap-5 p-4">
                  <div className={cn("rounded-2xl border p-4", panelContrast)}>
                    <div className="flex items-start gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={selectedNotification.sender?.image ?? ""} />
                        <AvatarFallback>
                          {(selectedNotification.sender?.name ??
                            selectedNotification.sender?.email ??
                            "系统")
                            .slice(0, 1)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={cn("font-semibold", preferences.elderlyMode && "text-lg")}>
                            {selectedNotification.title}
                          </h3>
                          {!selectedNotification.isRead ? (
                            <Badge variant="secondary">新消息</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          来自 {selectedNotification.sender?.name ?? selectedNotification.sender?.email ?? "系统"}
                          ，于 {formatTime(selectedNotification.createdAt)} 发送
                        </p>
                      </div>
                    </div>

                    <p className={cn("mt-4 leading-7", preferences.elderlyMode ? "text-base" : "text-sm")}>
                      {selectedNotification.summary}
                    </p>

                    {!selectedNotification.isRead ? (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void markAsRead(selectedNotification.id)}
                        >
                          <CheckCheckIcon data-icon="inline-start" />
                          标记为已读
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  {selectedNotification.type === "EMOTION_STATUS_UPDATE" ? (
                    <div className={cn("rounded-2xl border p-4", panelContrast)}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className={cn("font-semibold", preferences.elderlyMode && "text-lg")}>
                            长者情绪概览
                          </h4>
                          <p className="mt-1 text-sm text-muted-foreground">
                            基于已授权的 EmotionLog 聚合结果展示最近状态。
                          </p>
                        </div>
                        {emotionLoading ? <Loader2Icon className="animate-spin text-muted-foreground" /> : null}
                      </div>

                      {emotionError ? (
                        <p className="mt-4 text-sm text-destructive">{emotionError}</p>
                      ) : null}

                      {emotionSnapshot ? (
                        <div className="mt-4 flex flex-col gap-4">
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl bg-muted/50 p-3">
                              <p className="text-xs text-muted-foreground">最新情绪</p>
                              <p className="mt-1 font-semibold">
                                {emotionSnapshot.latestEmotion ?? "暂无"}
                              </p>
                            </div>
                            <div className="rounded-xl bg-muted/50 p-3">
                              <p className="text-xs text-muted-foreground">主导情绪</p>
                              <p className="mt-1 font-semibold">
                                {emotionSnapshot.dominantEmotion ?? "暂无"}
                              </p>
                            </div>
                            <div className="rounded-xl bg-muted/50 p-3">
                              <p className="text-xs text-muted-foreground">平均分值</p>
                              <p className="mt-1 font-semibold">
                                {emotionSnapshot.averageScore ?? "--"}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-xl border border-dashed p-3">
                            <p className="text-xs text-muted-foreground">
                              最近 5 条情绪记录
                            </p>
                            <div className="mt-3 flex flex-col gap-3">
                              {emotionSnapshot.recentEntries.length > 0 ? (
                                emotionSnapshot.recentEntries.map((entry) => (
                                  <div
                                    key={`${entry.createdAt}-${entry.emotion}`}
                                    className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2"
                                  >
                                    <div>
                                      <p className="font-medium">{entry.emotion}</p>
                                      <p className="text-xs text-muted-foreground">
                                        来源：{entry.source}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium">{entry.score}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatTime(entry.createdAt)}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  当前还没有可展示的情绪记录。
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="p-6 text-sm text-muted-foreground">
                  选择左侧的一条通知后，这里会显示详细内容。
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
