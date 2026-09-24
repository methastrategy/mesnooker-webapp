/**
 * Independent physical verification of generated paths.
 * Does NOT reimplement the solver — takes its OUTPUT and checks the
 * invariants every legal path must satisfy:
 *   1. cue path ends exactly at the ghost
 *   2. ghost = object - 2R * normalize(pocket - object)
 *   3. every bounce sits on its cushion line, in-segment
 *   4. law of reflection at every bounce (angle in == angle out)
 *   5. every cue segment stays on the cloth
 *   6. non-blocked paths clear blockers beyond the 0.5u graze margin
 *   7. non-blocked paths: object->pocket run clears blockers
 */
import { describe, expect, it } from "vitest";
import {
  solveEscape,
  PLAY,
  BALL_R,
  TWO_R,
  POCKET_MAP,
  type Side,
  type Vec,
} from "@/lib/geometry";

const R = BALL_R;

// deterministic PRNG so the property test is reproducible in CI
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalize(v: Vec): Vec {
  const l = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / l, y: v.y / l };
}

function onCushionLine(p: Vec, side: Side, tol = 1e-4): boolean {
  if (side === "b") return Math.abs(p.y - 0) < tol;
  if (side === "t") return Math.abs(p.y - PLAY.y1) < tol;
  if (side === "l") return Math.abs(p.x - 0) < tol;
  return Math.abs(p.x - PLAY.x1) < tol;
}

function inSegment(p: Vec, side: Side): boolean {
  if (side === "b" || side === "t") return p.x >= -1e-9 && p.x <= PLAY.x1 + 1e-9;
  return p.y >= -1e-9 && p.y <= PLAY.y1 + 1e-9;
}

function reflect(dir: Vec, side: Side): Vec {
  if (side === "b" || side === "t") return { x: dir.x, y: -dir.y };
  return { x: -dir.x, y: dir.y };
}

function segStaysOnCloth(a: Vec, b: Vec): boolean {
  for (let i = 1; i < 40; i++) {
    const t = i / 40;
    const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    if (p.x < -1e-4 || p.x > PLAY.x1 + 1e-4 || p.y < -1e-4 || p.y > PLAY.y1 + 1e-4) {
      return false;
    }
  }
  return true;
}

function segBallGap(a: Vec, b: Vec, c: Vec): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const L2 = abx * abx + aby * aby;
  if (L2 < 1e-12) return Math.hypot(c.x - a.x, c.y - a.y);
  let t = ((c.x - a.x) * abx + (c.y - a.y) * aby) / L2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(c.x - (a.x + abx * t), c.y - (a.y + aby * t));
}

describe("physics invariants across random configs", () => {
  it("all generated legal paths satisfy reflection + geometry invariants", () => {
    const rand = mulberry32(0x5eed);
    const randBetween = (lo: number, hi: number) => lo + rand() * (hi - lo);
    const pocketIds = ["bl", "bm", "br", "tl", "tm", "tr"] as const;

    let checked = 0;
    const failures: string[] = [];

    for (let iter = 0; iter < 300; iter++) {
      const cue: Vec = { x: randBetween(60, PLAY.x1 - 60), y: randBetween(60, PLAY.y1 - 60) };
      const object: Vec = { x: randBetween(60, PLAY.x1 - 60), y: randBetween(60, PLAY.y1 - 60) };
      if (Math.hypot(cue.x - object.x, cue.y - object.y) < 2 * R + 5) continue;
      const blockers: Vec[] = Array.from({ length: 2 }, () => ({
        x: randBetween(60, PLAY.x1 - 60),
        y: randBetween(60, PLAY.y1 - 60),
      }));
      const pocketId = pocketIds[iter % 6];
      const pocket = POCKET_MAP[pocketId].pos;
      const maxC = 1 + (iter % 3);

      const paths = solveEscape({ cue, object, blockers, pocketId, maxCushions: maxC });
      if (!paths.length) continue;

      const pocketDir = normalize({ x: pocket.x - object.x, y: pocket.y - object.y });
      const expectedGhost = {
        x: object.x - 2 * R * pocketDir.x,
        y: object.y - 2 * R * pocketDir.y,
      };

      for (const p of paths) {
        if (p.blocked) continue;
        checked++;

        // 1) cue ends at ghost
        const last = p.cuePolyline[p.cuePolyline.length - 1];
        if (Math.abs(last.x - p.ghost.x) > 1e-4 || Math.abs(last.y - p.ghost.y) > 1e-4) {
          failures.push(`iter${iter}: cue path does not end at its own ghost`);
        }

        // 2) ghost construction
        if (Math.hypot(p.ghost.x - expectedGhost.x, p.ghost.y - expectedGhost.y) > 1e-4) {
          failures.push(`iter${iter}: ghost not on object->pocket line`);
        }

        const sides = p.sideSequence;
        const bounces = p.cushionNotes.map((n) => n.point);

        // 3) bounces on the right cushion line, in segment
        bounces.forEach((bp, i) => {
          if (!onCushionLine(bp, sides[i])) {
            failures.push(`iter${iter}: bounce ${i} (${sides[i]}) off cushion line`);
          }
          if (!inSegment(bp, sides[i])) {
            failures.push(`iter${iter}: bounce ${i} (${sides[i]}) outside cushion segment`);
          }
        });

        // 4) law of reflection (bounce i sits at cuePolyline index i+1)
        for (let i = 0; i < bounces.length; i++) {
          const prev = p.cuePolyline[i];
          const bp = bounces[i];
          const next = p.cuePolyline[i + 2];
          const inDir = normalize({ x: bp.x - prev.x, y: bp.y - prev.y });
          const outDir = normalize({ x: next.x - bp.x, y: next.y - bp.y });
          const refl = reflect(inDir, sides[i]);
          const dot = refl.x * outDir.x + refl.y * outDir.y;
          if (dot < 0.999) {
            failures.push(`iter${iter}: reflection law violated at bounce ${i} (${sides[i]}) dot=${dot.toFixed(4)}`);
          }
        }

        // 5) segments stay on the cloth
        for (let i = 0; i < p.cuePolyline.length - 1; i++) {
          if (!segStaysOnCloth(p.cuePolyline[i], p.cuePolyline[i + 1])) {
            failures.push(`iter${iter}: segment ${i} exits the cloth`);
          }
        }

        // 6) blockers clear of the cue path beyond the engine's 0.5u graze margin
        for (const bl of blockers) {
          for (let i = 0; i < p.cuePolyline.length - 1; i++) {
            const gap = segBallGap(p.cuePolyline[i], p.cuePolyline[i + 1], bl) - (TWO_R - 0.5);
            if (gap < -1e-3) {
              failures.push(`iter${iter}: cue path crosses blocker beyond graze margin (gap=${gap.toFixed(2)})`);
            }
          }
        }

        // 7) object run clear
        for (const bl of blockers) {
          const gap = segBallGap(object, pocket, bl) - TWO_R;
          if (gap < -1e-3) {
            failures.push(`iter${iter}: object run blocked but path marked legal`);
          }
        }
      }
    }

    expect(checked).toBeGreaterThan(0);
    expect(failures.length).toBe(0);
  });
});
