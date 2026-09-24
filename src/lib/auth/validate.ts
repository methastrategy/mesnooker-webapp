// src/lib/auth/validate.ts — input validation for sign up / sign in.
// "กรอง email + password แค่นั้น" — kept deliberately simple per spec.

export const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export interface ValidationResult {
  ok: boolean;
  email?: string;
  password?: string;
  error?: "email" | "password" | "email_taken" | "credentials" | "rate_limited" | "db_offline";
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validEmail(raw: string): boolean {
  const e = normalizeEmail(raw);
  return e.length <= 254 && EMAIL_RE.test(e);
}

export function validPassword(raw: string): boolean {
  // 8–72 chars; 72 keeps scrypt input well under its 64KB cap
  return typeof raw === "string" && raw.length >= 8 && raw.length <= 72;
}
