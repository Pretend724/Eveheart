import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

export function SectionRow({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string;
  description?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
      <div className="flex-1 space-y-0.5">
        <Label
          htmlFor={htmlFor}
          className="cursor-pointer text-sm font-medium leading-none"
        >
          {label}
        </Label>
        {description && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="w-full shrink-0 sm:w-auto">{children}</div>
    </div>
  );
}
