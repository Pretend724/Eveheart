import { Heart } from "lucide-react";
import * as React from "react";

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <div
      className={`flex items-center justify-center gap-2 font-medium md:justify-start ${className || ""}`}
      {...props}
    >
      <Heart className="size-4" fill="pink" color="red" />
      Eveheart
    </div>
  );
}
