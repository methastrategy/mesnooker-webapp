// src/lib/auth/ratelimit.ts — per-IP attempt throttling & rate limiting (in-memory).
// Vercel serverless / Node: memory is per-instance, limiting bursts and brute force.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  return "unknown";
}

/** Record a failed attempt; returns true if the IP is now locked out. */
export function recordFail(req: Request): boolean {
  const ip = clientIp(req);
  const key = `auth_fail:${ip}`;
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.resetAt < now) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, b);
  }
  b.count += 1;
  // periodic cleanup so the map can't grow unbounded
  if (buckets.size > 2000) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }
  return b.count >= MAX_FAILS;
}

/** True if this IP is currently locked out from auth attempts. */
export function isLocked(req: Request): boolean {
  const ip = clientIp(req);
  const key = `auth_fail:${ip}`;
  const b = buckets.get(key);
  if (!b || b.resetAt < Date.now()) return false;
  return b.count >= MAX_FAILS;
}

/** Clear failed login counter upon successful authentication */
export function clearFailures(req: Request): void {
  const ip = clientIp(req);
  buckets.delete(`auth_fail:${ip}`);
}

/** General purpose rate limiter for arbitrary routes and action keys. */
export function checkRateLimit(
  req: Request,
  action = "api",
  maxHits = 30,
  windowMs = 60 * 1000
): { allowed: boolean; remaining: number } {
  const ip = clientIp(req);
  const key = `${action}:${ip}`;
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.resetAt < now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  b.count += 1;
  if (buckets.size > 2000) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }
  const allowed = b.count <= maxHits;
  const remaining = Math.max(0, maxHits - b.count);
  return { allowed, remaining };
}
