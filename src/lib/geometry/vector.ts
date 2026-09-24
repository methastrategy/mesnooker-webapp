import type { Vec } from "./types";

export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec, s: number): Vec => ({ x: a.x * s, y: a.y * s });
export const dot = (a: Vec, b: Vec): number => a.x * b.x + a.y * b.y;
export const cross2 = (a: Vec, b: Vec): number => a.x * b.y - a.y * b.x;
export const len = (a: Vec): number => Math.hypot(a.x, a.y);
export const dist = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y);

export const zeroVec = (): Vec => ({ x: 0, y: 0 });

export function normalize(a: Vec): Vec {
  const l = len(a);
  if (l < 1e-9) return zeroVec();
  return { x: a.x / l, y: a.y / l };
}

/** Rotate a vec by 90 degrees counter-clockwise. */
export const rot90 = (a: Vec): Vec => ({ x: -a.y, y: a.x });

export function lerp(a: Vec, b: Vec, t: number): Vec {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function angleBetween(a: Vec, b: Vec): number {
  const la = len(a);
  const lb = len(b);
  if (la < 1e-9 || lb < 1e-9) return 0;
  const c = Math.max(-1, Math.min(1, dot(a, b) / (la * lb)));
  return Math.acos(c);
}

export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
