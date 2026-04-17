export const PROXY_AUTH_HEADER_NAMES = {
  userId: "x-eveheart-user-id",
  userName: "x-eveheart-user-name",
  userEmail: "x-eveheart-user-email",
  userImage: "x-eveheart-user-image",
} as const;

export function encodeProxyHeaderValue(value: string | null | undefined) {
  return value ? encodeURIComponent(value) : "";
}

export function decodeProxyHeaderValue(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
