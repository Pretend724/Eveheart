import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@eveheart/db";
import { PreferencesClient } from "./preferences-client";

export default async function PreferencesSettingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const prefs = await prisma.userPreferences
    .findUnique({ where: { userId: session.user.id } })
    .catch(() => null); // graceful fallback before DB migration is applied

  return <PreferencesClient initialPreferences={prefs} />;
}
