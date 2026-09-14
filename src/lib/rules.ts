import type { BallColor, BallCounts, GameMode } from "@/types";

/** Official point values per ball for Point Count mode */
export const POINTS_RULES: Record<BallColor, number> = {
  red: 1,
  yellow: 2,
  green: 3,
  brown: 4,
  blue: 5,
  pink: 6,
  black: 7,
};

/** Point values per ball for Ball Count mode */
export const BALLS_RULES: Record<BallColor, number> = {
  red: 1,
  yellow: 1,
  green: 1,
  brown: 1,
  blue: 1,
  pink: 2,
  black: 2,
};

export const FOUL_VALUES: Record<GameMode, number> = {
  // accumulate penalties as negative numbers
  points: -4,
  balls: -2,
};

export const BALL_START: Record<BallColor, number> = {
  red: 15,
  yellow: 1,
  green: 1,
  brown: 1,
  blue: 1,
  pink: 1,
  black: 1,
};

export const BALL_ORDER: BallColor[] = [
  "red",
  "yellow",
  "green",
  "brown",
  "blue",
  "pink",
  "black",
];

export const BALL_NAME: Record<BallColor, string> = {
  red: "Red",
  yellow: "Yellow",
  green: "Green",
  brown: "Brown",
  blue: "Blue",
  pink: "Pink",
  black: "Black",
};

export const BALL_HEX: Record<BallColor, string> = {
  red: "#ef4444",
  yellow: "#facc15",
  green: "#22c55e",
  brown: "#a16207",
  blue: "#3b82f6",
  pink: "#ec4899",
  black: "#1f2937",
};

/** point value of a ball in a given mode */
export function ballValue(ball: BallColor, mode: GameMode): number {
  return mode === "points" ? POINTS_RULES[ball] : BALLS_RULES[ball];
}

/** Build the target cycle: player i scores against player (i-1) mod n.
 *  3 players: 0->2, 1->0, 2->1
 *  4 players: 0->3, 1->0, 2->1, 3->2
 *  Matching the spec: "1 scores against 3" (index0 target index n-1). */
export function buildTargetCycle(count: number): number[] {
  const cycle: number[] = [];
  for (let i = 0; i < count; i++) {
    cycle.push((i - 1 + count) % count);
  }
  return cycle;
}

/* ---------- Break / legal-move engine ---------- */

/** Thai snooker break rule: a turn alternates red → colour → red → colour.
 *  A foul or snooker-miss resets the break back to "must pot red first". */
export enum BreakPhase {
  RED_FIRST = "red_first",
  COLOUR = "colour",
}

/**
 * Determine the legal phase for the shooter based on the last shot in the
 * current break. Redefine from the events (reverse scan until a reset event).
 */
export function inferBreakPhase(
  events: Array<{ type: string; ball?: BallColor; playerId?: string; undone?: boolean }>,
  shooterId: string
): BreakPhase {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.undone) continue;
    // only consider this shooter's active break
    if (e.playerId && e.playerId !== shooterId) continue;
    if (e.type === "foul" || e.type === "snooker_miss") {
      return BreakPhase.RED_FIRST;
    }
    if (e.type === "pot") {
      // A red pot means "must now play a colour"; a colour pot means "red next".
      return e.ball === "red" ? BreakPhase.COLOUR : BreakPhase.RED_FIRST;
    }
    if (e.type === "snooker_hit" || e.type === "end_turn") {
      continue; // hit continues the break state; end_turn flips shooter but phase derives from last pot
    }
  }
  return BreakPhase.RED_FIRST;
}

/** Which balls are legally pottable right now.
 *  RED_FIRST: only red (the first pot of a break must be red).
 *  COLOUR:    only the six colours (red returns after a colour). */
export function legalBalls(
  phase: BreakPhase,
  counts: BallCounts
): BallColor[] {
  const available = BALL_ORDER.filter((c) => counts[c] > 0);
  if (phase === BreakPhase.RED_FIRST) return available.filter((c) => c === "red");
  // COLOUR phase: show colours only (no red until a colour has been potted)
  return available.filter((c) => c !== "red");
}

/** consecutive pot/hit count for the shooter's current break (resets on foul/miss) */
export function currentBreakCount(
  events: Array<{ type: string; playerId?: string; undone?: boolean }>,
  shooterId: string
): number {
  let count = 0;
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.undone) continue;
    if (e.playerId && e.playerId !== shooterId) continue;
    if (e.type === "foul" || e.type === "snooker_miss" || e.type === "end_turn") break;
    if (e.type === "pot" || e.type === "snooker_hit") count++;
  }
  return count;
}

/** Count how many balls of each colour this player potted in a frame (for per-ball money). */
export function pottedBallsPerPlayer(
  events: Array<{ type: string; playerId?: string; ball?: BallColor; undone?: boolean }>,
  playerId: string
): BallCounts {
  const c: BallCounts = { red: 0, yellow: 0, green: 0, brown: 0, blue: 0, pink: 0, black: 0 };
  events.forEach((e) => {
    if (e.undone) return;
    if (e.type === "pot" && e.playerId === playerId && e.ball) c[e.ball] += 1;
  });
  return c;
}