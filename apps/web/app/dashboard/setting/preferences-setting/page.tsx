import { prisma } from "@eveheart/db";
import { PreferencesClient } from "./preferences-client";
import { getRequiredProxyAuthenticatedUser } from "@/lib/server/proxy-auth";

export default async function PreferencesSettingPage() {
  const user = await getRequiredProxyAuthenticatedUser();

  const prefs = await prisma.userPreferences
    .findUnique({ where: { userId: user.id } })
    .catch(() => null); // graceful fallback before DB migration is applied

  return <PreferencesClient initialPreferences={prefs} />;
}
