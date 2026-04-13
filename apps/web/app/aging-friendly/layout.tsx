import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AgingFriendlyNav from "./aging-friendly-nav";
import { Logo } from "@/components/logo";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export const metadata: Metadata = {
  title: "Eveheart · 适老化模式",
  description: "Eveheart 适老化简化界面",
};

export default async function AgingFriendlyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* ── Fixed top header ── */}
      <header className="fixed top-0 inset-x-0 z-20 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-center h-16 px-4">
          <Logo></Logo>
          <AnimatedThemeToggler className="ml-auto"></AnimatedThemeToggler>
        </div>
      </header>

      {/* ── Scrollable content area ─────────────────────────────────────────
          mt-16  = clear the 64px fixed header
          mb-24  = clear the 96px fixed bottom nav
          text-xl = base font size for the entire aging-friendly surface;
                    many Tailwind text utilities use `rem` and will inherit
                    the root size, so applying text-xl here nudges the overall
                    readability up without touching global CSS.
          ──────────────────────────────────────────────────────────────────── */}
      <main className="flex-1  mt-16 mb-24 overflow-y-auto text-xl leading-relaxed">
        {children}
      </main>

      {/* ── Fixed bottom navigation ── */}
      <AgingFriendlyNav />
    </div>
  );
}
