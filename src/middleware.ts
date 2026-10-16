// src/middleware.ts — session gate for the whole app.
// - /login stays public (redirects home when already signed in)
// - /api/auth/signup + /api/auth/signin stay public
// - everything else: pages → /login, /api/* → 401
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

function redirectUrl(pathAndQuery: string, req: NextRequest): URL {
  const host = req.headers.get("host") || req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "") || "http";
  return new URL(pathAndQuery, `${proto}://${host}`);
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow PWA assets and service workers to load unauthenticated
  if (
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname === "/apple-touch-icon.png" ||
    pathname === "/icon.svg" ||
    pathname.startsWith("/icons/")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/login") {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (token && (await verifySession(token))) {
      return NextResponse.redirect(redirectUrl("/", req));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth/signup") || pathname.startsWith("/api/auth/signin")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const nextParam = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(redirectUrl(`/login?next=${nextParam}`, req));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest\\.webmanifest|sw\\.js|apple-touch-icon\\.png|icons/|icon\\.svg).*)",
  ],
};
