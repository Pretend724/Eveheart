"use client";

import type { User } from "next-auth";
import { AppSidebar } from "@/components/dashboard/sidebar/app-sidebar";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { NotificationCenterProvider } from "@/components/dashboard/notifications/notification-center";
import { Toaster } from "@/components/ui/sonner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: User;
}) {
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <NotificationCenterProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <DashboardHeader />
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </SidebarInset>
        <Toaster position="bottom-right" />
      </NotificationCenterProvider>
    </SidebarProvider>
  );
}
