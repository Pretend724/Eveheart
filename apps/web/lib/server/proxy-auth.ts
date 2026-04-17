import { headers } from "next/headers";
import type { User } from "next-auth";
import {
  decodeProxyHeaderValue,
  PROXY_AUTH_HEADER_NAMES,
} from "@/lib/proxy-auth-headers";

export type ProxyAuthenticatedUser = User & {
  id: string;
};

export async function getProxyAuthenticatedUser(): Promise<ProxyAuthenticatedUser | null> {
  const requestHeaders = await headers();
  const id = requestHeaders.get(PROXY_AUTH_HEADER_NAMES.userId);

  if (!id) {
    return null;
  }

  return {
    id,
    name: decodeProxyHeaderValue(
      requestHeaders.get(PROXY_AUTH_HEADER_NAMES.userName),
    ) ?? undefined,
    email:
      decodeProxyHeaderValue(
        requestHeaders.get(PROXY_AUTH_HEADER_NAMES.userEmail),
      ) ?? undefined,
    image:
      decodeProxyHeaderValue(
        requestHeaders.get(PROXY_AUTH_HEADER_NAMES.userImage),
      ) ?? undefined,
  };
}

export async function getRequiredProxyAuthenticatedUser() {
  const user = await getProxyAuthenticatedUser();

  if (!user?.id) {
    throw new Error("Missing authenticated user headers from proxy.");
  }

  return user;
}
