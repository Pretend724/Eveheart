import { prisma } from "@eveheart/db";
import { PreferencesClient } from "@/app/dashboard/setting/preferences-setting/preferences-client";
import { getRequiredProxyAuthenticatedUser } from "@/lib/server/proxy-auth";

export const dynamic = "force-dynamic";

export default async function AgingFriendlySettingsPage() {
  const user = await getRequiredProxyAuthenticatedUser();

  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-10 border-b border-amber-200 bg-amber-50 px-5 py-4 text-center dark:border-amber-800/50 dark:bg-amber-950/30">
        <p className="text-lg leading-snug font-semibold text-amber-800 dark:text-amber-200">
          当前处于适老化模式。
          <br className="sm:hidden" />
          在“显示与无障碍”中关闭并保存，可返回标准界面。
        </p>
      </div>

      <PreferencesClient initialPreferences={preferences} />
    </div>
  );
}
