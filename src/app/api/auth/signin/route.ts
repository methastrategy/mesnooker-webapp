// POST /api/auth/signin — verify { username, password }, start a session.
import { NextResponse, type NextRequest } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { findUserByUsername, hasAuthDb } from "@/lib/auth/db";
import { signSession, SESSION_COOKIE, SESSION_TTL_DAYS } from "@/lib/auth/session";
import { normalizeUsername, validUsername, validEmail } from "@/lib/auth/validate";
import { isLocked, recordFail, checkRateLimit } from "@/lib/auth/ratelimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (isLocked(req)) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }
  const rl = checkRateLimit(req, "signin_burst", 30, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { username, email, password } = body as { username?: string; email?: string; password?: string };
  const identifier = username ?? email;
  if (
    typeof identifier !== "string" ||
    (!validUsername(identifier) && !validEmail(identifier)) ||
    typeof password !== "string" ||
    !password
  ) {
    return NextResponse.json({ error: "Enter a valid username and password." }, { status: 400 });
  }
  if (!hasAuthDb()) {
    return NextResponse.json({ error: "Sign in is unavailable right now (database offline)." }, { status: 503 });
  }

  const un = normalizeUsername(identifier);
  const user = await findUserByUsername(un);
  // same error for unknown-user and wrong-password (no account enumeration)
  const verified = user ? verifyPassword(password, user.salt, user.passHash) : false;
  if (!verified || !user) {
    if (recordFail(req)) {
      return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
    }
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  const token = await signSession({ sub: user.id, username: user.username, email: user.email });
  const res = NextResponse.json({ ok: true, username: user.username, email: user.email });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 86400,
  });
  return res;
}

