import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import DigitalHuman from "@/components/dashboard/digital-human";
import ChatPanel from "@/components/dashboard/chat-panel";
import EmotionStatus from "@/components/dashboard/emotion-status";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    redirect("/dashboard/chat")
  );
}
