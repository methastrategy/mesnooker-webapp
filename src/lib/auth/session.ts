// src/lib/auth/session.ts — JWT (HS256) session tokens.
//
// Uses Web Crypto (globalThis.crypto.subtle) so the SAME module runs in both
// the Edge middleware and the Node.js route handlers. No dependencies.
//
// Payload: { sub: userId, email, iat, exp }. 30-day lifetime.
// Secret: AUTH_SECRET env var (required; refuses to run without it).

export const SESSION_COOKIE = "mesnooker_session";
export const SESSION_TTL_DAYS = 30;

function b64url(buf: Uint8Array | string): string {
  const s =
    typeof buf === "string"
      ? buf
      : Array.from(buf, (b) => String.fromCharCode(b)).join("");
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmacSha256(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)));
}

function secret(): string {
  return process.env.AUTH_SECRET ?? "";
}

export interface SessionPayload {
  sub: string;
  email: string;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const s = secret();
  if (!s) throw new Error("AUTH_SECRET env var is not configured");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(
    JSON.stringify({ ...payload, iat: now, exp: now + SESSION_TTL_DAYS * 86400 })
  );
  const sig = await hmacSha256(s, `${header}.${body}`);
  return `${header}.${body}.${b64url(sig)}`;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  const s = secret();
  if (!s) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, sigPart] = parts;
  const expected = await hmacSha256(s, `${h}.${p}`);
  let actual: Uint8Array;
  try {
    actual = fromB64url(sigPart);
  } catch {
    return null;
  }
  // constant-time comparison (same length, then XOR-accumulate)
  if (actual.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ actual[i];
  if (diff !== 0) return null;
  try {
    const body = JSON.parse(new TextDecoder().decode(fromB64url(p)));
    if (typeof body.exp !== "number" || body.exp * 1000 < Date.now()) return null;
    if (typeof body.sub !== "string" || typeof body.email !== "string") return null;
    return { sub: body.sub, email: body.email };
  } catch {
    return null;
  }
}
