import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import {
  encodeProxyHeaderValue,
  PROXY_AUTH_HEADER_NAMES,
} from "./lib/proxy-auth-headers";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const session = req.auth;

  if (!session?.user?.id) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${req.nextUrl.pathname}${req.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(
    PROXY_AUTH_HEADER_NAMES.userId,
    String((session.user as { id?: string }).id ?? ""),
  );
  requestHeaders.set(
    PROXY_AUTH_HEADER_NAMES.userName,
    encodeProxyHeaderValue(session.user.name),
  );
  requestHeaders.set(
    PROXY_AUTH_HEADER_NAMES.userEmail,
    encodeProxyHeaderValue(session.user.email),
  );
  requestHeaders.set(
    PROXY_AUTH_HEADER_NAMES.userImage,
    encodeProxyHeaderValue((session.user as { image?: string | null }).image),
  );

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/aging-friendly",
    "/aging-friendly/:path*",
  ],
};
