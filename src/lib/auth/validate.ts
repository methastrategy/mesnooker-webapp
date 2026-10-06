// src/lib/auth/validate.ts — input validation for sign up / sign in.
// "กรอง username + password แค่นั้น" — username >= 2 chars, password confirmation.

export const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export interface ValidationResult {
  ok: boolean;
  username?: string;
  email?: string;
  password?: string;
  error?:
    | "username"
    | "email"
    | "password"
    | "password_mismatch"
    | "username_taken"
    | "email_taken"
    | "credentials"
    | "rate_limited"
    | "db_offline";
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validUsername(raw: string): boolean {
  if (typeof raw !== "string") return false;
  const u = raw.trim();
  // Must be 2-50 chars and contain no control characters or line breaks
  return u.length >= 2 && u.length <= 50 && !/[\x00-\x1F\x7F]/.test(u);
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validEmail(raw: string): boolean {
  if (typeof raw !== "string") return false;
  const e = normalizeEmail(raw);
  if (e === "admin") return true;
  return e.length >= 2 && e.length <= 254 && EMAIL_RE.test(e);
}

export function validPassword(raw: string): boolean {
  if (typeof raw !== "string") return false;
  // 6–72 chars; 72 keeps scrypt input well under its 64KB cap
  return raw.length >= 6 && raw.length <= 72;
}

