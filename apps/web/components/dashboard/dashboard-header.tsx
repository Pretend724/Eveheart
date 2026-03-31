"use client";

import { SidebarTrigger } from "../ui/sidebar";
import { AnimatedThemeToggler } from "../ui/animated-theme-toggler";

export default function DashboardHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2">
      <div className="flex w-full items-center justify-between gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <AnimatedThemeToggler></AnimatedThemeToggler>
      </div>
    </header>
  );
}
