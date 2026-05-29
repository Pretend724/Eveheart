"use client";

export async function handleCopy(content: string) {
  await navigator.clipboard.writeText(content);
}
