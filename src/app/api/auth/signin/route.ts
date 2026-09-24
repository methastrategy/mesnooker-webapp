// POST /api/auth/signin — verify { email, password }, start a session.
import { NextResponse, type NextRequest } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { findUserByEmail, hasAuthDb } from "@/lib/auth/db";
import { signSession, SESSION_COOKIE, SESSION_TTL_DAYS } from "@/lib/auth/session";
import { normalizeEmail, validEmail } from "@/lib/auth/validate";
import { isLocked, recordFail } from "@/lib/auth/ratelimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (isLocked(req)) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { email, password } = body as { email?: string; password?: string };
  if (typeof email !== "string" || !validEmail(email) || typeof password !== "string") {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }
  if (!hasAuthDb()) {
    return NextResponse.json({ error: "Sign in is unavailable right now (database offline)." }, { status: 503 });
  }

  const em = normalizeEmail(email);
  const user = await findUserByEmail(em);
  // same error for unknown-email and wrong-password (no account enumeration)
  const verified = user ? verifyPassword(password, user.salt, user.passHash) : false;
  if (!verified || !user) {
    if (recordFail(req)) {
      return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
    }
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const token = await signSession({ sub: user.id, email: user.email });
  const res = NextResponse.json({ ok: true, email: user.email });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 86400,
  });
  return res;
}
