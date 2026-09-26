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
 * A bounce point is illegal if it sits inside a pocket mouth or cutout area
 * (middle pocket openings on top/bottom rails, corner pocket cutouts, or
 * within pocket drop radius).
 */
function bounceLegal(p: Vec): boolean {
  if (p.x < 0 || p.x > PLAY.x1 || p.y < 0 || p.y > PLAY.y1) return false;

  // Middle pocket cushion gaps (top & bottom cushions around x = PLAY_W / 2 = 600)
  // Real middle pocket jaw cutouts span ~45 units from centre
  if (p.x >= PLAY.x1 / 2 - 46 && p.x <= PLAY.x1 / 2 + 46) {
    if (p.y <= BALL_R + 8 || p.y >= PLAY.y1 - BALL_R - 8) {
      return false;
    }
  }

  // Corner pocket cutouts (all 4 corners)
  if (p.x <= 48 || p.x >= PLAY.x1 - 48) {
    if (p.y <= 48 || p.y >= PLAY.y1 - 48) {
      return false;
    }
  }

  // Pocket drop exclusion zone for every pocket
  for (const pk of POCKETS) {
    if (dist(p, pk.pos) < 52) return false;
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
      if (d < pk.r * 1.05) return false;
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
  const { cue, object, blockers, pocketId, targetMode = "hit", maxCushions, spin } = input;
  const pocket: PocketDef | undefined = POCKET_MAP[pocketId];

  const results: SolvePath[] = [];

  // BFS the reflection tree over side sequences up to maxCushions.
  const limit = clamp(maxCushions, 0, 6);
  let frontier: Side[][] = [[]];

  for (let depth = 0; depth <= limit; depth++) {
    const next: Side[][] = [];
    for (const seq of frontier) {
      let targetPoint = object;
      if (targetMode === "pot" && pocket) {
        targetPoint = ghostBall(object, pocket.pos);
        if (!ghostLegal(targetPoint)) {
          if (depth < limit) {
            next.push([...seq, "b"], [...seq, "t"], [...seq, "l"], [...seq, "r"]);
          }
          continue;
        }
      }

      const res = unfoldStraight(cue, targetPoint, seq, spin);
      if (res) {
        let legal = true;
        for (const bp of res.bounces) {
          if (!bounceLegal(bp)) {
            legal = false;
            break;
          }
        }
        if (legal) {
          // Calculate contact ghost ball position and polyline
          let cuePoly = res.points;
          let ghostPoint = targetPoint;
          let objectPoly: Vec[] = [object];

          if (targetMode === "hit") {
            const lastFrom = cuePoly.length > 1 ? cuePoly[cuePoly.length - 2] : cue;
            const approachDir = normalize(sub(object, lastFrom));
            ghostPoint = {
              x: object.x - TWO_R * approachDir.x,
              y: object.y - TWO_R * approachDir.y,
            };
            // Cue path ends at contact ghost point
            cuePoly = [...cuePoly.slice(0, -1), ghostPoint];
            objectPoly = [object, { x: object.x + 60 * approachDir.x, y: object.y + 60 * approachDir.y }];
          } else if (pocket) {
            objectPoly = [object, pocket.pos];
          }

          const cutDeg = cutAngleDeg(cuePoly, object, objectPoly[1] || pocket?.pos || object);
          const reb = reboundAngles(cuePoly, res.bounces, seq);

          const clearCue = cuePathClearsBalls(cuePoly, blockers);
          const clearObj = targetMode === "pot" && pocket ? objectRunLegal(object, pocket.pos, blockers) : true;
          const clearPockets = cuePathClearsPockets(cuePoly);

          let minClearance = Infinity;
          for (const bl of blockers) {
            for (let i = 0; i < cuePoly.length - 1; i++) {
              minClearance = Math.min(
                minClearance,
                pointSegmentDist(cuePoly[i], cuePoly[i + 1], bl) - TWO_R
              );
            }
          }
          if (blockers.length === 0) minClearance = 999;

          let totalLength = 0;
          for (let i = 0; i < cuePoly.length - 1; i++)
            totalLength += dist(cuePoly[i], cuePoly[i + 1]);
          totalLength += dist(ghostPoint, object);

          const difficulty = difficultyScore({
            cushions: seq.length,
            cutDeg,
            reboundDegs: reb,
            minClearance: Math.max(0, minClearance),
            totalLength,
          });

          const blocked = !clearCue.ok || !clearObj || !clearPockets;
          const blockReason = !clearPockets
            ? "ลูกขาวผ่านปากหลุม"
            : !clearCue.ok
              ? clearCue.reason
              : !clearObj
                ? "ทางวิ่งลูกเป้าถูกบัง"
                : undefined;

          const notes: CounselNote[] = res.bounces.map((bp, i) => {
            const side: Side = seq[i];
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
            id: `${seq.length}-${seq.map((s) => (s === "b" ? "B" : s === "t" ? "T" : s === "l" ? "L" : "R")).join("")}`,
            pocketId,
            cushions: seq.length,
            sideSequence: seq,
            cuePolyline: cuePoly,
            ghost: ghostPoint,
            objectPolyline: objectPoly,
            totalLength,
            difficulty,
            rawScore: difficulty + totalLength / 4000,
            cushionNotes: notes,
            blocked,
            blockReason,
          });
        }
      }
      if (depth < limit) {
        next.push([...seq, "b"], [...seq, "t"], [...seq, "l"], [...seq, "r"]);
      }
    }
    frontier = next;
  }

  // Ranking Algorithm:
  // 1. Unblocked (clean) paths first
  // 2. Fewest cushion bounces first (0 cushions -> 1 cushion -> 2 cushions)
  // 3. Shortest travel distance
  results.sort((a, b) => {
    if (a.blocked !== b.blocked) return a.blocked ? 1 : -1;
    if (a.cushions !== b.cushions) return a.cushions - b.cushions;
    if (a.totalLength !== b.totalLength) return a.totalLength - b.totalLength;
    return a.rawScore - b.rawScore;
  });

  return results;
}

/** Best (highlight) path = first non-blocked entry, else first entry. */
export function bestPath(paths: SolvePath[]): SolvePath | null {
  const legal = paths.find((p) => !p.blocked);
  return legal ?? (paths.length ? paths[0] : null);
}

export { POCKETS };
