// src/lib/auth-client.ts — browser-side auth helpers (fetch → /api/auth/*).
// Replaces the old localStorage gate: the session now lives in an httpOnly
// cookie set by the server; the client only renders what the server allows.

export interface MeResponse {
  username: string;
  email?: string;
  id: string;
}

async function json(res: Response) {
  try {
    return await res.json();
  } catch {
    return {} as Record<string, string>;
  }
}

export async function apiSignIn(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await json(res);
  return res.ok ? { ok: true } : { ok: false, error: data.error ?? "Sign in failed. Try again." };
}

export async function apiSignUp(
  username: string,
  password: string,
  confirmPassword?: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
      confirmPassword,
    }),
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
    const userDisplay = data?.username || data?.email;
    return userDisplay ? { ...data, username: userDisplay } : null;
  } catch {
    return null;
  }
}

export function clientValidUsername(v: string): boolean {
  if (typeof v !== "string") return false;
  const u = v.trim();
  return u.length >= 2 && u.length <= 50 && !/[\x00-\x1F\x7F]/.test(u);
}

export function clientValidPassword(v: string): boolean {
  if (typeof v !== "string") return false;
  return v.length >= 6 && v.length <= 72;
}

// Backward compatibility helpers
export const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
export function clientValidEmail(v: string): boolean {
  if (typeof v !== "string") return false;
  const e = v.trim().toLowerCase();
  if (e === "admin") return true;
  return e.length >= 2 && e.length <= 254 && EMAIL_RE.test(e);
}

export function getSafeRedirectUrl(next: string | null): string {
  if (!next) return "/";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/";
  }
  try {
    const parsed = new URL(next, "http://localhost");
    if (parsed.origin !== "http://localhost") return "/";
    if (parsed.pathname === "/login") return "/";
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return "/";
  }
}

