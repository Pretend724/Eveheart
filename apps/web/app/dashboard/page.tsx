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
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Digital Human */}
          <div className="lg:col-span-2">
            <DigitalHuman />
          </div>

          {/* Right Column: Chat & Emotion */}
          <div className="flex flex-col gap-6">
            <EmotionStatus />
            <ChatPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
