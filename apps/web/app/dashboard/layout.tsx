import { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getProxyAuthenticatedUser } from "@/lib/server/proxy-auth";

export const metadata: Metadata = {
  title: "控制台 - Eveheart",
  description: "Eveheart 用户控制台与服务入口。",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getProxyAuthenticatedUser();

  return <DashboardShell user={user ?? undefined}>{children}</DashboardShell>;
}
