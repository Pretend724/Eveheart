import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { UIMessage } from "ai";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 复制工具函数
export const handleCopy = async (content: string) => {
  await navigator.clipboard.writeText(content);
};

// lib/ai-utils.ts
export function getMessageTextFromParts(parts: UIMessage["parts"]) {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}
