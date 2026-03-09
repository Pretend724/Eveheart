import { Metadata } from "next";

export const metadata: Metadata = {
  title: "控制台 - Eveheart",
  description: "AI情感陪护控制台",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
