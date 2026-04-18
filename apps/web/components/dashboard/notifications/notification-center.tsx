"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  BellIcon,
  CheckCheckIcon,
  HeartPulseIcon,
  Loader2Icon,
  MailIcon,
  ShieldAlertIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  deleteAllNotificationsAction,
  deleteNotificationAction,
  markNotificationReadAction,
} from "@/lib/actions/family-notifications";
import { cn } from "@/lib/utils";
import {
  EmotionSnapshotSchema,
  NotificationsResponseSchema,
  type EmotionSnapshot,
  type NotificationRecord,
  type NotificationsResponse,
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
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  isDeletingAll: boolean;
  deletingNotificationIds: Set<string>;
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "时间未知";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

async function fetchNotificationsFromApi(signal?: AbortSignal) {
  const response = await fetch("/api/notifications?take=30", {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error("无法获取通知列表。");
  }

  const payload = await response.json();
  const parsed = NotificationsResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("通知列表响应格式无效。");
  }

  return parsed.data;
}

export function NotificationCenterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
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
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDeletingAll, setIsDeletingAll] = React.useState(false);
  const [deletingNotificationIds, setDeletingNotificationIds] = React.useState<Set<string>>(
    new Set(),
  );

  const hasHydratedRef = React.useRef(false);
  const knownNotificationIdsRef = React.useRef<Set<string>>(new Set());
  const notificationsRef = React.useRef<NotificationRecord[]>([]);
  const latestRefreshRequestIdRef = React.useRef(0);
  const inFlightMarkAsReadIdsRef = React.useRef<Set<string>>(new Set());
  const deletingNotificationIdsRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  React.useEffect(() => {
    deletingNotificationIdsRef.current = deletingNotificationIds;
  }, [deletingNotificationIds]);

  const refreshNotifications = React.useCallback(async () => {
    const requestId = latestRefreshRequestIdRef.current + 1;
    latestRefreshRequestIdRef.current = requestId;
    setIsLoading(true);

    const abortController = new AbortController();

    try {
      const response = await fetchNotificationsFromApi(abortController.signal);

      if (requestId !== latestRefreshRequestIdRef.current) {
        return;
      }

      setNotifications(response.notifications);
      notificationsRef.current = response.notifications;
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
              id: `notification:${notification.id}`,
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
      if (requestId === latestRefreshRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const markAsRead = React.useCallback(async (notificationId: string) => {
    const target = notificationsRef.current.find((item) => item.id === notificationId);
    if (!target || target.isRead) {
      return;
    }

    if (inFlightMarkAsReadIdsRef.current.has(notificationId)) {
      return;
    }

    inFlightMarkAsReadIdsRef.current.add(notificationId);

    try {
      const result = await markNotificationReadAction({ notificationId });
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      const readAt = new Date().toISOString();

      setNotifications((current) => {
        const next = current.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                isRead: true,
                readAt,
              }
            : item,
        );
        notificationsRef.current = next;
        return next;
      });
      setUnreadCount((current) => Math.max(current - 1, 0));
    } finally {
      inFlightMarkAsReadIdsRef.current.delete(notificationId);
    }
  }, []);

  const deleteNotification = React.useCallback(async (notificationId: string) => {
    const target = notificationsRef.current.find((item) => item.id === notificationId);
    if (!target) {
      return;
    }

    if (deletingNotificationIdsRef.current.has(notificationId)) {
      return;
    }

    setDeletingNotificationIds((current) => {
      const next = new Set(current);
      next.add(notificationId);
      deletingNotificationIdsRef.current = next;
      return next;
    });

    try {
      const result = await deleteNotificationAction({ notificationId });
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      const remainingNotifications = notificationsRef.current.filter(
        (item) => item.id !== notificationId,
      );
      const nextSelectedNotificationId =
        selectedNotificationId === notificationId
          ? remainingNotifications[0]?.id ?? null
          : selectedNotificationId;

      setNotifications(remainingNotifications);
      notificationsRef.current = remainingNotifications;
      setUnreadCount((current) =>
        target.isRead ? current : Math.max(current - 1, 0),
      );
      setSelectedNotificationId(nextSelectedNotificationId);
      knownNotificationIdsRef.current.delete(notificationId);

      toast.success("通知已删除。");
    } finally {
      setDeletingNotificationIds((current) => {
        const next = new Set(current);
        next.delete(notificationId);
        deletingNotificationIdsRef.current = next;
        return next;
      });
    }
  }, [selectedNotificationId]);

  const deleteAllNotifications = React.useCallback(async () => {
    if (isDeletingAll) {
      return;
    }

    setIsDeletingAll(true);

    try {
      const result = await deleteAllNotificationsAction();
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setNotifications([]);
      notificationsRef.current = [];
      setUnreadCount(0);
      setSelectedNotificationId(null);
      knownNotificationIdsRef.current = new Set();
      setDeletingNotificationIds(new Set());
      deletingNotificationIdsRef.current = new Set();

      toast.success(result.message);
    } finally {
      setIsDeletingAll(false);
    }
  }, [isDeletingAll]);

  const openNotificationCenter = React.useCallback(
    (notificationId?: string | null) => {
      if (notificationId) {
        setSelectedNotificationId(notificationId);
      } else {
        setSelectedNotificationId(
          (current) => current ?? notificationsRef.current[0]?.id ?? null,
        );
      }

      setOpen(true);
      void refreshNotifications();
    },
    [refreshNotifications],
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
      deleteNotification,
      deleteAllNotifications,
      isDeletingAll,
      deletingNotificationIds,
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
      deleteNotification,
      deleteAllNotifications,
      isDeletingAll,
      deletingNotificationIds,
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
    deleteNotification,
    deleteAllNotifications,
    isDeletingAll,
    deletingNotificationIds,
  } = useNotificationCenterValue();

  const [emotionSnapshot, setEmotionSnapshot] = React.useState<EmotionSnapshot | null>(
    null,
  );
  const [emotionLoading, setEmotionLoading] = React.useState(false);
  const [emotionError, setEmotionError] = React.useState<string | null>(null);
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = React.useState(false);

  const denseText = preferences.elderlyMode ? "text-base" : "text-sm";
  const panelContrast = preferences.highContrast ? "ring-1 ring-border" : "";
  const selectedEmotionElderId =
    selectedNotification?.type === "EMOTION_STATUS_UPDATE"
      ? getPayloadString(selectedNotification.payload, "elderId")
      : null;

  React.useEffect(() => {
    if (!selectedEmotionElderId) {
      setEmotionSnapshot(null);
      setEmotionError(null);
      setEmotionLoading(false);
      return;
    }

    const abortController = new AbortController();

    async function loadEmotionSnapshot() {
      setEmotionLoading(true);
      setEmotionError(null);

      try {
        const response = await fetch(
          `/api/family/emotion/${selectedEmotionElderId}`,
          {
            method: "GET",
            signal: abortController.signal,
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("暂时无法读取情绪概览。");
        }

        const payload = await response.json();
        const parsed = EmotionSnapshotSchema.safeParse(payload);
        if (!parsed.success) {
          throw new Error("情绪概览响应格式无效。");
        }

        setEmotionSnapshot(parsed.data);
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("[emotion-snapshot]", error);
          setEmotionSnapshot(null);
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
  }, [selectedEmotionElderId]);

  const handleDrawerOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        closeNotificationCenter();
      }
    },
    [closeNotificationCenter],
  );

  return (
    <>
      <Drawer open={open} onOpenChange={handleDrawerOpenChange} direction="bottom">
        <DrawerContent className={cn("w-full")}>
        <DrawerHeader className="pb-0">
          <DrawerTitle
            className={cn(
              "flex items-center gap-2",
              preferences.elderlyMode && "text-xl",
            )}
          >
            <BellIcon />
            通知中心
            {unreadCount > 0 ? <Badge>{unreadCount}</Badge> : null}
          </DrawerTitle>
          <DrawerDescription>
            这里会汇总家属绑定、留言提醒与情绪状况更新。
          </DrawerDescription>
        </DrawerHeader>

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[0.95fr_1.05fr]">
          <div
            className={cn(
              "flex min-h-0 flex-col border-b lg:border-r lg:border-b-0",
              panelContrast,
            )}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div
                className={cn(
                  "font-medium",
                  preferences.elderlyMode && "text-base",
                )}
              >
                最近通知
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isDeletingAll}
                    onClick={() => setConfirmDeleteAllOpen(true)}
                  >
                    {isDeletingAll ? (
                      <Loader2Icon className="animate-spin" data-icon="inline-start" />
                    ) : (
                      <Trash2Icon data-icon="inline-start" />
                    )}
                    删除全部
                  </Button>
                ) : null}
                {isLoading ? (
                  <Loader2Icon className="animate-spin text-muted-foreground" />
                ) : null}
              </div>
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
                    const isDeleting = deletingNotificationIds.has(notification.id);

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex w-full flex-col gap-3 rounded-2xl border p-4 text-left transition-colors hover:bg-muted/60",
                          notificationTone(notification.type),
                          notification.id === selectedNotificationId &&
                            "ring-2 ring-primary/30",
                          !notification.isRead && "shadow-sm",
                          preferences.highContrast && "border-foreground/20",
                          isDeleting && "opacity-70",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-start gap-3 text-left"
                            onClick={() => {
                              setSelectedNotificationId(notification.id);
                              if (!notification.isRead) {
                                void markAsRead(notification.id);
                              }
                            }}
                          >
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
                              <p
                                className={cn(
                                  "mt-1 line-clamp-2 text-muted-foreground",
                                  denseText,
                                )}
                              >
                                {notification.summary}
                              </p>
                            </div>
                          </button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="shrink-0"
                            disabled={isDeleting || isDeletingAll}
                            onClick={() => void deleteNotification(notification.id)}
                          >
                            {isDeleting ? (
                              <Loader2Icon className="animate-spin" />
                            ) : (
                              <Trash2Icon />
                            )}
                            <span className="sr-only">删除通知</span>
                          </Button>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatTime(notification.createdAt)}</span>
                          <span>
                            {notification.sender?.name ??
                              notification.sender?.email ??
                              "系统"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="px-4 py-3">
              <div
                className={cn(
                  "font-medium",
                  preferences.elderlyMode && "text-base",
                )}
              >
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
                        <AvatarImage
                          src={selectedNotification.sender?.image ?? ""}
                        />
                        <AvatarFallback>
                          {(
                            selectedNotification.sender?.name ??
                            selectedNotification.sender?.email ??
                            "系统"
                          )
                            .slice(0, 1)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={cn(
                              "font-semibold",
                              preferences.elderlyMode && "text-lg",
                            )}
                          >
                            {selectedNotification.title}
                          </h3>
                          {!selectedNotification.isRead ? (
                            <Badge variant="secondary">新消息</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          来自{" "}
                          {selectedNotification.sender?.name ??
                            selectedNotification.sender?.email ??
                            "系统"}
                          ，于 {formatTime(selectedNotification.createdAt)} 发送
                        </p>
                      </div>
                    </div>

                    <p
                      className={cn(
                        "mt-4 leading-7",
                        preferences.elderlyMode ? "text-base" : "text-sm",
                      )}
                    >
                      {selectedNotification.summary}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {!selectedNotification.isRead ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void markAsRead(selectedNotification.id)}
                        >
                          <CheckCheckIcon data-icon="inline-start" />
                          标记为已读
                        </Button>
                      ) : null}
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={
                          deletingNotificationIds.has(selectedNotification.id) ||
                          isDeletingAll
                        }
                        onClick={() => void deleteNotification(selectedNotification.id)}
                      >
                        {deletingNotificationIds.has(selectedNotification.id) ? (
                          <Loader2Icon
                            className="animate-spin"
                            data-icon="inline-start"
                          />
                        ) : (
                          <Trash2Icon data-icon="inline-start" />
                        )}
                        删除通知
                      </Button>
                    </div>
                  </div>

                  {selectedNotification.type === "EMOTION_STATUS_UPDATE" ? (
                    <div className={cn("rounded-2xl border p-4", panelContrast)}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4
                            className={cn(
                              "font-semibold",
                              preferences.elderlyMode && "text-lg",
                            )}
                          >
                            长者情绪概览
                          </h4>
                          <p className="mt-1 text-sm text-muted-foreground">
                            基于已授权的 EmotionLog 聚合结果展示最近状态。
                          </p>
                        </div>
                        {emotionLoading ? (
                          <Loader2Icon className="animate-spin text-muted-foreground" />
                        ) : null}
                      </div>

                      {emotionError ? (
                        <p className="mt-4 text-sm text-destructive">
                          {emotionError}
                        </p>
                      ) : null}

                      {emotionSnapshot ? (
                        <div className="mt-4 flex flex-col gap-4">
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl bg-muted/50 p-3">
                              <p className="text-xs text-muted-foreground">
                                最新情绪
                              </p>
                              <p className="mt-1 font-semibold">
                                {emotionSnapshot.latestEmotion ?? "暂无"}
                              </p>
                            </div>
                            <div className="rounded-xl bg-muted/50 p-3">
                              <p className="text-xs text-muted-foreground">
                                主导情绪
                              </p>
                              <p className="mt-1 font-semibold">
                                {emotionSnapshot.dominantEmotion ?? "暂无"}
                              </p>
                            </div>
                            <div className="rounded-xl bg-muted/50 p-3">
                              <p className="text-xs text-muted-foreground">
                                平均分值
                              </p>
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
                                      <p className="font-medium">
                                        {entry.emotion}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        来源：{entry.source}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium">
                                        {entry.score}
                                      </p>
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
        </DrawerContent>
      </Drawer>

      <AlertDialog
        open={confirmDeleteAllOpen}
        onOpenChange={setConfirmDeleteAllOpen}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除全部通知？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后将无法恢复，当前通知列表中的全部消息都会被清空。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              variant="outline"
              disabled={isDeletingAll}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletingAll}
              onClick={async (event) => {
                event.preventDefault();
                await deleteAllNotifications();
                setConfirmDeleteAllOpen(false);
              }}
            >
              {isDeletingAll ? (
                <Loader2Icon
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : (
                <Trash2Icon data-icon="inline-start" />
              )}
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
