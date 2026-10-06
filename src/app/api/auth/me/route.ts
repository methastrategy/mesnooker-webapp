import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/auth/ratelimit";

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
  return NextResponse.json({
    username: session.username,
    email: session.email ?? session.username,
    id: session.sub,
  });
}

