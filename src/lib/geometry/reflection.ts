import type { CueSpin, Side, Vec } from "./types";
import { PLAY, BALL_R } from "./tables";

type Axis = { kind: "x" | "y"; value: number };

const BOTTOM: Axis = { kind: "y", value: BALL_R };
const TOP: Axis = { kind: "y", value: PLAY.y1 - BALL_R };
const LEFT: Axis = { kind: "x", value: BALL_R };
const RIGHT: Axis = { kind: "x", value: PLAY.x1 - BALL_R };

export function mirrorAcross(p: Vec, axis: Axis): Vec {
  if (axis.kind === "y") return { x: p.x, y: 2 * axis.value - p.y };
  return { x: 2 * axis.value - p.x, y: p.y };
}

function axisFor(side: Side): Axis {
  switch (side) {
    case "b":
      return BOTTOM;
    case "t":
      return TOP;
    case "l":
      return LEFT;
    case "r":
      return RIGHT;
  }
}

export interface UnfoldResult {
  /** cue polyline in REAL space: cue -> bounces... -> target */
  points: Vec[];
  /** bounce points only, ordered */
  bounces: Vec[];
  /** mirrored (virtual) target */
  virtual: Vec;
}

/**
 * Unfold a straight shot from `from` to `to` across the given cushion side
 * sequence, with optional side-spin / english deflection. Returns bounce points
 * in real space, or null if the sequence is geometrically impossible.
 */
export function unfoldStraight(
  from: Vec,
  to: Vec,
  sides: Side[],
  spin?: CueSpin
): UnfoldResult | null {
  const n = sides.length;
  if (n === 0) {
    return { points: [from, to], bounces: [], virtual: to };
  }

  // 1) Unfold: mirror target to generate virtual target chain V_n, V_{n-1}, ..., V_0
  const V: Vec[] = new Array(n + 1);
  V[n] = to;
  const sideSpin = spin?.side ?? 0;

  for (let i = n - 1; i >= 0; i--) {
    let mirrored = mirrorAcross(V[i + 1], axisFor(sides[i]));
    if (sideSpin !== 0) {
      // Side spin shifts the virtual mirror position tangentially
      const side = sides[i];
      const shiftMag = sideSpin * 45;
      if (side === "b") {
        mirrored = { x: mirrored.x + shiftMag, y: mirrored.y };
      } else if (side === "t") {
        mirrored = { x: mirrored.x - shiftMag, y: mirrored.y };
      } else if (side === "l") {
        mirrored = { x: mirrored.x, y: mirrored.y - shiftMag };
      } else if (side === "r") {
        mirrored = { x: mirrored.x, y: mirrored.y + shiftMag };
      }
    }
    V[i] = mirrored;
  }

  // 2) Walk forward from `from` to calculate exact bounce points P_0, P_1, ..., P_{n-1}
  const bounces: Vec[] = new Array(n);
  let curr = from;

  for (let i = 0; i < n; i++) {
    const axis = axisFor(sides[i]);
    const targetVirtual = V[i];
    const denom = targetVirtual[axis.kind] - curr[axis.kind];
    if (Math.abs(denom) < 1e-9) return null; // parallel to the cushion

    const t = (axis.value - curr[axis.kind]) / denom;
    if (t <= 1e-6 || t >= 1 - 1e-6) return null; // crossed from wrong side

    const bp: Vec =
      axis.kind === "y"
        ? { x: curr.x + t * (targetVirtual.x - curr.x), y: axis.value }
        : { x: axis.value, y: curr.y + t * (targetVirtual.y - curr.y) };

    // Bounce point must sit on the cushion segment
    if (axis.kind === "y") {
      if (bp.x < BALL_R - 1e-6 || bp.x > PLAY.x1 - BALL_R + 1e-6) return null;
    } else {
      if (bp.y < BALL_R - 1e-6 || bp.y > PLAY.y1 - BALL_R + 1e-6) return null;
    }

    bounces[i] = bp;
    curr = bp;
  }

  return { points: [from, ...bounces, to], bounces, virtual: V[0] };
}
