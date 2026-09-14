import type { BallColor, GameMode } from "@/types";

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