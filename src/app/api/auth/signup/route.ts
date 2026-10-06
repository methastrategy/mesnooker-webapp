// POST /api/auth/signup — create account { username, password, confirmPassword } and start a session.
// Per spec: username >= 2 characters, password confirmation.
import { NextResponse, type NextRequest } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { initAuthDb, findUserByUsername, createUser, hasAuthDb } from "@/lib/auth/db";
import { signSession, SESSION_COOKIE, SESSION_TTL_DAYS } from "@/lib/auth/session";
import { normalizeUsername, validUsername, validPassword } from "@/lib/auth/validate";
import { isLocked } from "@/lib/auth/ratelimit";

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
  const { username, email, password, confirmPassword } = body as {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
  const identifier = username ?? email;
  if (typeof identifier !== "string" || !validUsername(identifier)) {
    return NextResponse.json({ error: "Username must be at least 2 characters." }, { status: 400 });
  }
  if (typeof password !== "string" || !validPassword(password)) {
    return NextResponse.json({ error: "Password must be at least 6 characters (up to 72)." }, { status: 400 });
  }
  if (typeof confirmPassword !== "string" || !confirmPassword) {
    return NextResponse.json({ error: "Please confirm your password." }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }
  if (!hasAuthDb()) {
    return NextResponse.json({ error: "Sign up is unavailable right now (database offline)." }, { status: 503 });
  }

  const un = normalizeUsername(identifier);
  await initAuthDb();
  const existing = await findUserByUsername(un);
  if (existing) {
    return NextResponse.json({ error: "Username already taken. Please choose another or sign in." }, { status: 409 });
  }

  const { hash, salt } = hashPassword(password);
  let id: string;
  try {
    id = await createUser(un, hash, salt);
  } catch (err) {
    // unique constraint race: concurrent sign-up with same username
    const msg = String((err as Error).message ?? "");
    if (msg.includes("duplicate") || msg.includes("23505")) {
      return NextResponse.json({ error: "Username already taken. Please choose another or sign in." }, { status: 409 });
    }
    console.error("[auth.signup]", err);
    return NextResponse.json({ error: "Could not create account. Try again." }, { status: 502 });
  }

  // auto sign-in: sign up → signed in, no extra step (per spec)
  const token = await signSession({ sub: id, username: un });
  const res = NextResponse.json({ ok: true, username: un });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 86400,
  });
  return res;
}

