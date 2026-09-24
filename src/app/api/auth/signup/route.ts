// POST /api/auth/signup — create account { email, password } and start a session.
// Per spec: sign up with email + password, valid input → can sign in immediately.
import { NextResponse, type NextRequest } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { initAuthDb, findUserByEmail, createUser, hasAuthDb } from "@/lib/auth/db";
import { signSession, SESSION_COOKIE, SESSION_TTL_DAYS } from "@/lib/auth/session";
import { normalizeEmail, validEmail, validPassword } from "@/lib/auth/validate";
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
  if (typeof email !== "string" || !validEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (typeof password !== "string" || !validPassword(password)) {
    return NextResponse.json({ error: "Password must be 8–72 characters." }, { status: 400 });
  }
  if (!hasAuthDb()) {
    return NextResponse.json({ error: "Sign up is unavailable right now (database offline)." }, { status: 503 });
  }

  const em = normalizeEmail(email);
  await initAuthDb();
  const existing = await findUserByEmail(em);
  if (existing) {
    return NextResponse.json({ error: "Email already registered. Sign in instead." }, { status: 409 });
  }

  const { hash, salt } = hashPassword(password);
  let id: string;
  try {
    id = await createUser(em, hash, salt);
  } catch (err) {
    // unique constraint race: concurrent sign-up with same email
    const msg = String((err as Error).message ?? "");
    if (msg.includes("duplicate") || msg.includes("23505")) {
      return NextResponse.json({ error: "Email already registered. Sign in instead." }, { status: 409 });
    }
    console.error("[auth.signup]", err);
    return NextResponse.json({ error: "Could not create account. Try again." }, { status: 502 });
  }

  // auto sign-in: sign up → signed in, no extra step (per spec)
  const token = await signSession({ sub: id, email: em });
  const res = NextResponse.json({ ok: true, email: em });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 86400,
  });
  return res;
}
