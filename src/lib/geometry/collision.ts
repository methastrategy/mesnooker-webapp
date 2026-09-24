import type { Vec } from "./types";
import { dist, sub, dot, scale, add, len } from "./vector";

/**
 * Line-Circle collision helpers used to test whether a travelling ball's path
 * is blocked by another ball (centre-to-centre gap < 2R means contact).
 */

/** Closest point on segment AB to point P. */
export function closestPointOnSegment(a: Vec, b: Vec, p: Vec): Vec {
  const ab = sub(b, a);
  const ap = sub(p, a);
  const abLen2 = dot(ab, ab);
  if (abLen2 < 1e-9) return { ...a };
  const t = Math.max(0, Math.min(1, dot(ap, ab) / abLen2));
  return add(a, scale(ab, t));
}

/** Minimum distance from point P to segment AB. */
export function pointSegmentDist(a: Vec, b: Vec, p: Vec): number {
  return dist(p, closestPointOnSegment(a, b, p));
}

/**
 * True if a ball travelling along segment A->B will touch a static ball of
 * centre C with radius `r` (gap threshold, e.g. 2 * BALL_R).
 */
export function segmentHitsCircle(a: Vec, b: Vec, c: Vec, r: number): boolean {
  return pointSegmentDist(a, b, c) < r;
}

/**
 * Find where the line from `origin` in direction `dir` first touches a circle
 * (centre c, radius r). Returns the hit point or null. `dir` need not be
 * normalised.
 */
export function rayCircleHit(
  origin: Vec,
  dir: Vec,
  c: Vec,
  r: number
): Vec | null {
  const d = sub(dir, { x: 0, y: 0 });
  const f = sub(origin, c);
  const a = dot(d, d);
  const b = 2 * dot(f, d);
  const cc = dot(f, f) - r * r;
  const disc = b * b - 4 * a * cc;
  if (disc < 0) return null;
  const sq = Math.sqrt(disc);
  const t1 = (-b - sq) / (2 * a);
  const t2 = (-b + sq) / (2 * a);
  const t = t1 >= 0 ? t1 : t2 >= 0 ? t2 : -1;
  if (t < 0) return null;
  return add(origin, scale(d, t / (len(d) || 1)));
}
