import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/logo";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function Home({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-between">
          <Logo />
          <AnimatedThemeToggler />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <Image
          src="/login-dark.png"
          alt="login page image"
          fill
          priority
          className="object-cover"
        />
        <Image
          src="/login.png"
          alt="login page image"
          fill
          priority
          className="object-cover dark:hidden"
        />
      </div>
    </div>
  );
}
