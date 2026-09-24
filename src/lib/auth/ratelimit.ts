// src/lib/auth/ratelimit.ts — per-IP attempt throttling (in-memory).
// Vercel serverless: memory is per-instance, so this limits bursts per
// instance — enough for a personal app; not a substitute for global limits.
type Bucket = { fails: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}

/** Record a failed attempt; returns true if the IP is now locked out. */
export function recordFail(req: Request): boolean {
  const ip = clientIp(req);
  const now = Date.now();
  let b = buckets.get(ip);
  if (!b || b.resetAt < now) {
    b = { fails: 0, resetAt: now + WINDOW_MS };
    buckets.set(ip, b);
  }
  b.fails += 1;
  // periodic cleanup so the map can't grow unbounded
  if (buckets.size > 1000) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }
  return b.fails >= MAX_FAILS;
}

/** True if this IP is currently locked out. */
export function isLocked(req: Request): boolean {
  const b = buckets.get(clientIp(req));
  if (!b || b.resetAt < Date.now()) return false;
  return b.fails >= MAX_FAILS;
}
