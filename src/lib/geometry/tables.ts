import type { Vec } from "./types";

/**
 * 12ft table geometry. PLAY = 1200 x 600 playing (cushion-to-cushion) area.
 * CUSHION = 26 thickness, BALL_R = 24 (12ft ball diameter 57.15mm vs 3600mm
 * playing length ≈ 0.01588 ratio -> 19; we use 24 for touch-feel + clarity).
 */
export const PLAY_W = 1200;
export const PLAY_H = 600;
export const CUSHION = 26;
export const BALL_R = 24;
export const VIEW_W = PLAY_W + CUSHION * 2;
export const VIEW_H = PLAY_H + CUSHION * 2;

export const PLAY = { x0: 0, y0: 0, x1: PLAY_W, y1: PLAY_H } as const;

export const TWO_R = BALL_R * 2;

export interface PocketInfo {
  id: string;
  name: string;
  pos: Vec;
  r: number;
  /** corners: "corner", middles: "middle" */
  kind: "corner" | "middle";
}

const POCKET_R = 34;

/** Pockets in playing-area coordinates. 12ft baulk/middle mouths. */
export const POCKETS: PocketInfo[] = [
  { id: "bl", name: "Bottom-Left", pos: { x: 0, y: 0 }, r: POCKET_R, kind: "corner" },
  { id: "bm", name: "Bottom-Middle", pos: { x: PLAY_W / 2, y: 0 }, r: POCKET_R * 0.92, kind: "middle" },
  { id: "br", name: "Bottom-Right", pos: { x: PLAY_W, y: 0 }, r: POCKET_R, kind: "corner" },
  { id: "tl", name: "Top-Left", pos: { x: 0, y: PLAY_H }, r: POCKET_R, kind: "corner" },
  { id: "tm", name: "Top-Middle", pos: { x: PLAY_W / 2, y: PLAY_H }, r: POCKET_R * 0.92, kind: "middle" },
  { id: "tr", name: "Top-Right", pos: { x: PLAY_W, y: PLAY_H }, r: POCKET_R, kind: "corner" },
];

export const POCKET_MAP: Record<string, PocketInfo> = Object.fromEntries(
  POCKETS.map((p) => [p.id, p])
);

export const CUE_COLOR: string = "#f2ead8";
export const BALL_COLORS: Record<string, string> = {
  cue: "#f2ead8",
  red: "#c1121f",
  yellow: "#f7d44c",
  green: "#1a9e5c",
  brown: "#8a4b2a",
  blue: "#1d5dc4",
  pink: "#e26a9d",
  black: "#171310",
};

export function ballLabel(color: string): string {
  return color === "cue" ? "Cue Ball" : color[0].toUpperCase() + color.slice(1);
}

/** Snooker dockets (60–70cm spacing on a 12ft) — used by the Practice Generator. */
export const SPOTS: Record<string, Vec> = {
  yellow: { x: 84, y: PLAY_H },
  green: { x: 84, y: 0 },
  brown: { x: 306, y: PLAY_H / 2 },
  blue: { x: PLAY_W / 2, y: PLAY_H / 2 },
  pink: { x: PLAY_W - 258, y: PLAY_H / 2 },
  black: { x: PLAY_W - 100, y: PLAY_H / 2 },
};

export const BAULK_SPOT = { x: 330, y: PLAY_H / 2 };
export const BAULK_LINE = { x: 420 };

export function isInPlay(p: Vec, margin = 0): boolean {
  return (
    p.x >= -margin &&
    p.x <= PLAY_W + margin &&
    p.y >= -margin &&
    p.y <= PLAY_H + margin
  );
}

/**
 * Clamp a position to a legal ball centre: at least BALL_R inside the
 * cushions, and not overlapping any given balls.
 */
export function clampToTable(p: Vec, others: { pos: Vec }[] = [], r: number = BALL_R): Vec {
  let x = Math.max(r, Math.min(PLAY_W - r, p.x));
  let y = Math.max(r, Math.min(PLAY_H - r, p.y));
  const minGap = r * 2 + 0.5;
  for (const o of others) {
    const dx = x - o.pos.x;
    const dy = y - o.pos.y;
    const d = Math.hypot(dx, dy);
    if (d < minGap) {
      if (d < 1e-6) {
        x += minGap;
      } else {
        x = o.pos.x + (dx / d) * minGap;
        y = o.pos.y + (dy / d) * minGap;
      }
      x = Math.max(r, Math.min(PLAY_W - r, x));
      y = Math.max(r, Math.min(PLAY_H - r, y));
    }
  }
  return { x, y };
}
