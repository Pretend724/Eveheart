import { MessageCircleHeart } from "lucide-react";
import * as React from "react";
import Image from "next/image";

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <div
      className={`flex items-center justify-center gap-2 font-medium md:justify-start ${className || ""}`}
      {...props}
    >
      {/* <MessageCircleHeart className="size-8" color="oklch(0.7889 0.0802 359.9375)"  /> */}
      <Image src="/logo.svg" width={32} height={32} alt="logo svg"></Image>
      <p className="text-2xl">Eveheart</p>
    </div>
  );
}
