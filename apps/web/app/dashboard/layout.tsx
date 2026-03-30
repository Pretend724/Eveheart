import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { AppSidebar } from "@/components/dashboard/sidebar/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/dashboard/dashboard-header";

export const metadata: Metadata = {
  title: "控制台 - Eveheart",
  description: "AI情感陪护控制台",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar user={session.user} />
      <SidebarInset>
        <DashboardHeader></DashboardHeader>
        <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
