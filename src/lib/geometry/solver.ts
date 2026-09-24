import type {
  CounselNote,
  PocketDef,
  Side,
  SolvePath,
  SolverInput,
  Vec,
} from "./types";
import {
  PLAY,
  BALL_R,
  TWO_R,
  POCKETS,
  POCKET_MAP,
} from "./tables";
import {
  angleBetween,
  toDeg,
  dist,
  sub,
  normalize,
  clamp,
} from "./vector";
import { unfoldStraight } from "./reflection";
import { pointSegmentDist, segmentHitsCircle } from "./collision";

/**
 * Snooker Escape Solver.
 *
 * Given a cue ball, an object ball, the intended pocket, and a cushion
 * budget, enumerate every feasible cue-ball route (0..maxCushions bounces)
 * via the Cushion Reflection Tree, check line-circle collisions against all
 * other balls, rank the survivors, and hand back a Best Path plus the full
 * candidate list.
 */

/** Ghost ball centre: where the cue must be at the instant of contact. */
export function ghostBall(object: Vec, pocket: Vec, r: number = BALL_R): Vec {
  const d = normalize(sub(pocket, object));
  return { x: object.x - 2 * r * d.x, y: object.y - 2 * r * d.y };
}

/** Is the ghost centre a legal position on the cloth? */
function ghostLegal(g: Vec): boolean {
  return (
    g.x >= BALL_R - 2 &&
    g.x <= PLAY.x1 - BALL_R + 2 &&
    g.y >= BALL_R - 2 &&
    g.y <= PLAY.y1 - BALL_R + 2
  );
}

/**
 * Cushion Impact Solver: verify the object ball's straight run to the pocket
 * is legal (stays on cloth, clears other balls, enters the pocket mouth).
 */
export function objectRunLegal(
  object: Vec,
  pocket: Vec,
  blockers: Vec[]
): boolean {
  for (const b of blockers) {
    if (segmentHitsCircle(object, pocket, b, TWO_R)) return false;
  }
  return true;
}

/**
 * A bounce point is illegal if it sits inside a pocket mouth (the ball would
 * drop in) or outside the cushion segment.
 */
function bounceLegal(p: Vec, targetPocketId: string): boolean {
  if (p.x < 0 || p.x > PLAY.x1) return false;
  for (const pk of POCKETS) {
    if (pk.id === targetPocketId && dist(p, pk.pos) < pk.r * 0.6) {
      // bouncing "through" the target pocket mouth is actually the shot
      // escaping — but for an ESCAPE we reject: the cue would drop in.
      return false;
    }
    if (dist(p, pk.pos) < pk.r * 0.65) return false;
  }
  return true;
}

/** Cue path must not cross a pocket mouth (cue potted = foul). */
function cuePathClearsPockets(poly: Vec[]): boolean {
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i];
    const b = poly[i + 1];
    for (const pk of POCKETS) {
      const d = pointSegmentDist(a, b, pk.pos);
      if (d < pk.r * 0.55) return false;
    }
  }
  return true;
}

/** All balls the cue path must clear (centre-to-centre gap >= 2R). */
function cuePathClearsBalls(poly: Vec[], blockers: Vec[]): {
  ok: boolean;
  reason?: string;
} {
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i];
    const b = poly[i + 1];
    for (const bl of blockers) {
      if (segmentHitsCircle(a, b, bl, TWO_R - 0.5)) {
        return { ok: false, reason: "cue path blocked by a ball" };
      }
    }
  }
  return { ok: true };
}

/** Cut angle at the contact: 0 = full ball, 90 = graze. */
export function cutAngleDeg(cueLastSegment: Vec[], object: Vec, pocket: Vec): number {
  // approach dir: ghost -> (into object) is the last segment direction
  const from = cueLastSegment[cueLastSegment.length - 2];
  const to = cueLastSegment[cueLastSegment.length - 1];
  const approach = normalize(sub(to, from));
  const objectRun = normalize(sub(pocket, object));
  // angle between the approach and the object's run direction
  const a = angleBetween(approach, objectRun);
  return toDeg(Math.min(Math.PI, a));
}

/**
 * Difficulty 1..10. Higher = harder.
 * Weights: cushion count, cut angle, cushion rebound angles, obstacle
 * clearance, total travel.
 */
export function difficultyScore(input: {
  cushions: number;
  cutDeg: number;
  reboundDegs: number[];
  minClearance: number; // units, gap between paths and blockers
  totalLength: number;
}): number {
  let d = 1.5;
  d += Math.min(3.2, input.cushions * 0.85);
  // cut angle: 0 -> 0, 90 -> 3.5 (power of the thin graze)
  const c = clamp(input.cutDeg / 85, 0, 1);
  d += 3.5 * c * c;
  // rebound sharpness: each rebound under 20° off the face is nasty
  for (const r of input.reboundDegs) {
    if (r < 25) d += (25 - r) * 0.09;
  }
  // tight clearance: < 30 units of gap to a blocker
  if (input.minClearance < 30) d += 1.5 * (1 - input.minClearance / 30);
  // long travel
  if (input.totalLength > 1100) d += (input.totalLength - 1100) / 900;
  return clamp(Math.round(d * 10) / 10, 1, 10);
}

function reboundAngles(points: Vec[], bounces: Vec[], sides: Side[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < bounces.length; i++) {
    const prev = points[i];
    const bp = bounces[i];
    const inDir = normalize(sub(bp, prev));
    // angle off the cushion face for the incoming ray (face = cushion direction)
    const side = sides[i];
    const face = side === "l" || side === "r" ? { x: 0, y: 1 } : { x: 1, y: 0 };
    const a = Math.abs(angleBetween(inDir, face) - Math.PI / 2); // 0 = grazing
    out.push(toDeg(a));
  }
  return out;
}

/**
 * Enumerate every legal escape route.
 *
 * `maxCushions` = number of cushion bounces to allow (0..6). The Reflection
 * Tree is a BFS over side sequences; legality prunes branches early.
 */
export function solveEscape(input: SolverInput): SolvePath[] {
  const { cue, object, blockers, pocketId, maxCushions } = input;
  const pocket: PocketDef | undefined = POCKET_MAP[pocketId];
  if (!pocket) return [];

  const g = ghostBall(object, pocket.pos);
  if (!ghostLegal(g)) return [];
  if (!objectRunLegal(object, pocket.pos, blockers)) {
    // still return (marked) so UI can explain "object run blocked"
  }

  const results: SolvePath[] = [];

  const addPath = (
    sides: Side[],
    path: { points: Vec[]; bounces: Vec[] }
  ) => {
    const cuePoly = path.points; // ends at ghost
    const objectPoly: Vec[] = [object, pocket.pos];
    const cutDeg = cutAngleDeg(cuePoly, object, pocket.pos);
    const reb = reboundAngles(cuePoly, path.bounces, sides);

    const clearCue = cuePathClearsBalls(cuePoly, blockers);
    const clearObj = objectRunLegal(object, pocket.pos, blockers);
    const clearPockets = cuePathClearsPockets(cuePoly);

    // min clearance between either path and any blocker surface
    let minClearance = Infinity;
    for (const bl of blockers) {
      for (let i = 0; i < cuePoly.length - 1; i++) {
        minClearance = Math.min(
          minClearance,
          pointSegmentDist(cuePoly[i], cuePoly[i + 1], bl) - TWO_R
        );
      }
      minClearance = Math.min(minClearance, pointSegmentDist(object, pocket.pos, bl) - TWO_R);
    }
    if (blockers.length === 0) minClearance = 999;

    let totalLength = 0;
    for (let i = 0; i < cuePoly.length - 1; i++)
      totalLength += dist(cuePoly[i], cuePoly[i + 1]);
    totalLength += dist(object, pocket.pos);

    const difficulty = difficultyScore({
      cushions: sides.length,
      cutDeg,
      reboundDegs: reb,
      minClearance: Math.max(0, minClearance),
      totalLength,
    });

    const blocked = !clearCue.ok || !clearObj || !clearPockets;
    const blockReason = !clearPockets
      ? "cue would pass a pocket mouth"
      : !clearCue.ok
        ? clearCue.reason
        : !clearObj
          ? "object run blocked by a ball"
          : undefined;

    const notes: CounselNote[] = path.bounces.map((bp, i) => {
      const side: Side = sides[i];
      const prev = cuePoly[i];
      const face = side === "l" || side === "r" ? { x: 0, y: 1 } : { x: 1, y: 0 };
      const inDir = normalize(sub(bp, prev));
      const a = Math.abs(angleBetween(inDir, face) - Math.PI / 2);
      return {
        index: i + 1,
        side,
        point: bp,
        angleDeg: Math.round(toDeg(a) * 10) / 10,
      };
    });

    results.push({
      id: `${sides.length}-${sides.map((s) => (s === "b" ? "B" : s === "t" ? "T" : s === "l" ? "L" : "R")).join("")}`,
      pocketId,
      cushions: sides.length,
      sideSequence: sides,
      cuePolyline: cuePoly,
      ghost: g,
      objectPolyline: objectPoly,
      totalLength,
      difficulty,
      rawScore: difficulty + totalLength / 4000,
      cushionNotes: notes,
      blocked,
      blockReason,
    });
  };

  // BFS the reflection tree over side sequences up to maxCushions.
  const limit = clamp(maxCushions, 0, 6);
  let frontier: Side[][] = [[]];
  for (let depth = 0; depth <= limit; depth++) {
    const next: Side[][] = [];
    for (const seq of frontier) {
      const res = unfoldStraight(cue, g, seq);
      if (res) {
        // every bounce must be on the cloth and out of the pocket mouths
        let legal = true;
        for (const bp of res.bounces) {
          if (!bounceLegal(bp, pocketId)) {
            legal = false;
            break;
          }
        }
        if (legal) addPath(seq, res);
      }
      if (depth < limit) {
        next.push([...seq, "b"], [...seq, "t"], [...seq, "l"], [...seq, "r"]);
      }
    }
    frontier = next;
  }

  // Ranking Algorithm: legal first, lowest raw score (difficulty + travel)
  // wins the highlight.
  results.sort((a, b) => {
    if (a.blocked !== b.blocked) return a.blocked ? 1 : -1;
    if (a.rawScore !== b.rawScore) return a.rawScore - b.rawScore;
    return a.totalLength - b.totalLength;
  });

  return results;
}

/** Best (highlight) path = first non-blocked entry, else first entry. */
export function bestPath(paths: SolvePath[]): SolvePath | null {
  const legal = paths.find((p) => !p.blocked);
  return legal ?? (paths.length ? paths[0] : null);
}

export { POCKETS };
