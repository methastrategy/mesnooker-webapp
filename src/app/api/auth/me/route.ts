import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/auth/ratelimit";
import { findUserById, findUserByUsername, hasAuthDb } from "@/lib/auth/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const rl = checkRateLimit(req, "auth_me", 60, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // Database verification: Ensure user wasn't deleted / purged during reset
  if (hasAuthDb()) {
    let dbUser = await findUserById(session.sub);
    if (!dbUser && session.username) {
      dbUser = await findUserByUsername(session.username);
    }

    if (!dbUser) {
      // User account has been deleted or purged — force-clear session cookie
      const res = NextResponse.json({ error: "unauthenticated" }, { status: 401 });
      res.cookies.set(SESSION_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
      return res;
    }

    return NextResponse.json({
      username: dbUser.username,
      email: dbUser.email ?? dbUser.username,
      id: dbUser.id,
    });
  }

  return NextResponse.json({
    username: session.username,
    email: session.email ?? session.username,
    id: session.sub,
  });
}

