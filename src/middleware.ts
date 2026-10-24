// src/middleware.ts — session & guest gate for the whole app.
// - Guest Mode: Core pages (/, /match, /setup, /settlement, /history, /stats, /player, /settings, /about)
//   are directly accessible without requiring login.
// - /login redirects to home (/) if already authenticated.
// - /api/auth/* endpoints are handled by their respective route handlers.
// - Protected API endpoints require a valid session (returns 401 if unauthenticated).
// - Future protected pages require a valid session (redirects to /login).
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

function redirectUrl(pathAndQuery: string, req: NextRequest): URL {
  const host = req.headers.get("host") || req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "") || "http";
  return new URL(pathAndQuery, `${proto}://${host}`);
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow PWA assets, icons, and service workers to load unauthenticated
  if (
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname === "/apple-touch-icon.png" ||
    pathname === "/icon.svg" ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/assets/")
  ) {
    return NextResponse.next();
  }

  // Login page: bounce to home if already authenticated
  if (pathname === "/login") {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (token && (await verifySession(token))) {
      return NextResponse.redirect(redirectUrl("/", req));
    }
    return NextResponse.next();
  }

  // Public authentication API endpoints
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Guest Mode: Allow instant access to all core companion pages
  const isGuestAccessiblePage =
    pathname === "/" ||
    pathname.startsWith("/match") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/settlement") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/stats") ||
    pathname.startsWith("/player") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/about");

  if (isGuestAccessiblePage) {
    return NextResponse.next();
  }

  // Guard for protected routes (protected APIs or future member-only pages)
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
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest\\.webmanifest|sw\\.js|apple-touch-icon\\.png|icons/|assets/|icon\\.svg).*)",
  ],
};

