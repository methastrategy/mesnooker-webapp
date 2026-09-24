import type { Side, Vec } from "./types";
import { PLAY } from "./tables";

/**
 * Reflection / Mirror Method — the geometric core of the Escape Solver.
 *
 * A cushion acts as a mirror. For a cue ball that must reach a target point
 * (the GHOST ball) after bouncing off cushions in side-sequence
 * S = [b, t, b, ...], we "unfold" the table: mirror the target across the
 * last cushion, then the previous one, and so on. The cue ball then sees a
 * single straight (virtual) target. Each time that straight line crosses a
 * mirror plane we recover the real bounce point on that cushion.
 *
 * Legality: every bounce point must fall within the cushion segment (0..PLAY_W
 * along x), and while walking the unfold each mirror crossing must happen on
 * the correct side (the ray actually goes INTO the cushion, then out).
 */

type Axis = { kind: "x" | "y"; value: number };

const BOTTOM: Axis = { kind: "y", value: 0 };
const TOP: Axis = { kind: "y", value: PLAY.y1 };
const LEFT: Axis = { kind: "x", value: 0 };
const RIGHT: Axis = { kind: "x", value: PLAY.x1 };

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
 * sequence. Returns bounce points in real space, or null if the sequence is
 * geometrically impossible (parallel to a cushion, bounce off the segment, or
 * a mirror crossed from the wrong side).
 */
export function unfoldStraight(
  from: Vec,
  to: Vec,
  sides: Side[]
): UnfoldResult | null {
  if (sides.length === 0) {
    return { points: [from, to], bounces: [], virtual: to };
  }

  // 1) Unfold: mirror the target through the LAST cushion first.
  let virtual = to;
  for (let i = sides.length - 1; i >= 0; i--) {
    virtual = mirrorAcross(virtual, axisFor(sides[i]));
  }

  // 2) Straight line from -> virtual. Cross each mirror in REVERSE order to
  //    recover bounce points, walking from the virtual target back to `from`.
  const n = sides.length;
  const bounces: Vec[] = new Array(n);
  let current = virtual;

  for (let k = n - 1; k >= 0; k--) {
    const axis = axisFor(sides[k]);
    const denom =
      axis.kind === "y" ? from.y - current.y : from.x - current.x;
    if (Math.abs(denom) < 1e-9) return null; // parallel to the cushion

    // p(t) = current + t*(from - current); find t where p hits the plane.
    const t = (axis.value - current[axis.kind]) / denom;
    if (t <= 1e-6 || t >= 1 - 1e-6) return null; // crossed from wrong side

    const bp: Vec =
      axis.kind === "y"
        ? { x: current.x + t * (from.x - current.x), y: axis.value }
        : { x: axis.value, y: current.y + t * (from.y - current.y) };

    // Bounce point must sit on the cushion segment (inside the table):
    // bottom/top cushions span the full length (x), side cushions the width (y).
    if (axis.kind === "y") {
      if (bp.x < -1e-6 || bp.x > PLAY.x1 + 1e-6) return null;
    } else {
      if (bp.y < -1e-6 || bp.y > PLAY.y1 + 1e-6) return null;
    }
    bounces[k] = bp;
    current = bp;
  }

  return { points: [from, ...bounces, to], bounces, virtual };
}
