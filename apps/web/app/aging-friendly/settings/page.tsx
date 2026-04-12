import { auth } from "@/lib/auth";
import { prisma } from "@eveheart/db";
import { redirect } from "next/navigation";
import { PreferencesClient } from "@/app/dashboard/setting/preferences-setting/preferences-client";

export const dynamic = "force-dynamic";

export default async function AgingFriendlySettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="pb-6">
      {/* Exit-mode banner */}
      <div className="sticky top-0 z-10 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/50 px-5 py-4 text-center">
        <p className="text-lg font-semibold text-amber-800 dark:text-amber-200 leading-snug">
          当前处于适老化模式。
          <br className="sm:hidden" />
          在「显示与无障碍」中关闭并保存，可返回标准界面。
        </p>
      </div>

      {/* Full preferences form — font size is inherited from the layout's text-xl */}
      <PreferencesClient initialPreferences={preferences} />
    </div>
  );
}
