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

/** Point values per ball for Ball Count mode.
 *  User rule: red=1, every colour=1 EXCEPT brown(น้ำตาล) and black(ดำ)=2. */
export const BALLS_RULES: Record<BallColor, number> = {
  red: 1,
  yellow: 1,
  green: 1,
  brown: 2,
  blue: 1,
  pink: 1,
  black: 2,
};

export const FOUL_VALUES: Record<GameMode, number> = {
  // accumulate penalties as negative numbers
  points: -4,
  balls: -2,
};

/** Snooker "miss" (shoot the snook but it does not land / no foul): value is
 *  mode-dependent. Point count: −2. Ball count: −1. */
export const SNOOKER_MISS_VALUES: Record<GameMode, number> = {
  points: -2,
  balls: -1,
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

/** Official potting order for the six colours once all reds are cleared. */
export const COLOUR_ORDER: BallColor[] = [
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
    // An end_turn means this visit/break is over: whoever shoots next starts a
    // fresh visit, so they must pot a red first (while reds remain). Do NOT
    // carry a stale "must play a colour" from a previous visit.
    if (e.type === "end_turn") {
      return BreakPhase.RED_FIRST;
    }
    // only consider this shooter's active break
    if (e.playerId && e.playerId !== shooterId) continue;
    if (e.type === "foul" || e.type === "snooker_miss") {
      return BreakPhase.RED_FIRST;
    }
    if (e.type === "pot") {
      // A red pot means "must now play a colour"; a colour pot means "red next".
      return e.ball === "red" ? BreakPhase.COLOUR : BreakPhase.RED_FIRST;
    }
    if (e.type === "snooker_hit") {
      continue; // hit continues the break state
    }
  }
  return BreakPhase.RED_FIRST;
}

/** Which balls are legally pottable right now.
 *  RED_FIRST: only red while reds remain; once reds run out, the colours are
 *             potted to clear the table.
 *  COLOUR:    the six colours (red returns after a colour while reds remain).
 *
 *  Once all reds are gone, the colours MUST be potted in their official order
 *  (yellow → green → brown → blue → pink → black) — no skipping.
 *  Thai-snooker nuance: the shooter who pots the LAST red is still in their
 *  COLOUR phase, so they may pot ANY colour of their choice that one finishing
 *  time. Only once they have potted that free colour (phase cycles back to
 *  RED_FIRST) does strict ordered clearing begin. */
export function legalBalls(
  phase: BreakPhase,
  counts: BallCounts
): BallColor[] {
  const available = BALL_ORDER.filter((c) => counts[c] > 0);

  // Reds all gone → colours are cleared.
  if (counts.red === 0) {
    // Right after potting the last red, the shooter is still entitled to a
    // FREE colour of their choosing (completing their visit). Only after that
    // free colour do the remaining colours lock in order.
    if (phase === BreakPhase.COLOUR) {
      return available.filter((c) => c !== "red");
    }
    const next = COLOUR_ORDER.find((c) => counts[c] > 0);
    return next ? [next] : [];
  }

  if (phase === BreakPhase.RED_FIRST) {
    // reds still available → must pot red
    return available.filter((c) => c === "red");
  }
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