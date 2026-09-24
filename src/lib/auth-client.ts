// src/lib/auth-client.ts — browser-side auth helpers (fetch → /api/auth/*).
// Replaces the old localStorage gate: the session now lives in an httpOnly
// cookie set by the server; the client only renders what the server allows.

export interface MeResponse {
  email: string;
  id: string;
}

async function json(res: Response) {
  try {
    return await res.json();
  } catch {
    return {} as Record<string, string>;
  }
}

export async function apiSignIn(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await json(res);
  return res.ok ? { ok: true } : { ok: false, error: data.error ?? "Sign in failed. Try again." };
}

export async function apiSignUp(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await json(res);
  return res.ok ? { ok: true } : { ok: false, error: data.error ?? "Sign up failed. Try again." };
}

export async function apiSignOut(): Promise<void> {
  await fetch("/api/auth/signout", { method: "POST" });
}

/** null when unauthenticated (401 or network error). */
export async function fetchMe(): Promise<MeResponse | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as MeResponse;
    return data && data.email ? data : null;
  } catch {
    return null;
  }
}

export const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
export function clientValidEmail(v: string): boolean {
  return v.trim().length <= 254 && EMAIL_RE.test(v.trim());
}
export function clientValidPassword(v: string): boolean {
  return v.length >= 8 && v.length <= 72;
}
