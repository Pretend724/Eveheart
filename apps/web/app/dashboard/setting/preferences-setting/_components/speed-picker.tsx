"use client";

import { cn } from "@/lib/utils";
import type { VoiceSpeed } from "../_lib/preferences-types";

const SPEED_OPTIONS: { id: VoiceSpeed; label: string }[] = [
  { id: "slow", label: "慢速" },
  { id: "normal", label: "正常" },
  { id: "fast", label: "快速" },
];

export function SpeedPicker({
  value,
  onChange,
}: {
  value: VoiceSpeed;
  onChange: (value: VoiceSpeed) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-border p-1">
      {SPEED_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === option.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
