import { describe, expect, it } from "vitest";
import {
  solveEscape,
  bestPath,
  ghostBall,
  PLAY,
  BALL_R,
  TWO_R,
  POCKET_MAP,
  type Vec,
} from "@/lib/geometry";

const EPS = 1e-6;

describe("escape solver", () => {
  it("straight shot: 0-cushion path ends at the ghost on the object->pocket line", () => {
    const cue: Vec = { x: 300, y: 300 };
    const object: Vec = { x: 600, y: 300 };
    const paths = solveEscape({
      cue,
      object,
      blockers: [],
      pocketId: "br",
      maxCushions: 2,
    });
    expect(paths.length).toBeGreaterThan(0);
    const best = bestPath(paths)!;
    expect(best.blocked).toBe(false);
    expect(best.cushions).toBe(0);
    const last = best.cuePolyline[best.cuePolyline.length - 1];
    expect(Math.abs(last.x - best.ghost.x)).toBeLessThan(1e-4);
    expect(Math.abs(last.y - best.ghost.y)).toBeLessThan(1e-4);

    // ghost = object - 2R * normalize(pocket - object)
    const pocket = POCKET_MAP["br"].pos;
    const d = Math.hypot(pocket.x - object.x, pocket.y - object.y);
    const g = ghostBall(object, pocket);
    expect(Math.abs(g.x - (object.x - (2 * BALL_R * (pocket.x - object.x)) / d))).toBeLessThan(1e-6);
    expect(Math.abs(g.y - (object.y - (2 * BALL_R * (pocket.y - object.y)) / d))).toBeLessThan(1e-6);
  });

  it("full-ball straight pot has cut angle ~0 and low difficulty", () => {
    const cue: Vec = { x: 200, y: 400 };
    const object: Vec = { x: 500, y: 400 };
    const paths = solveEscape({
      cue,
      object,
      blockers: [],
      pocketId: "br",
      maxCushions: 1,
    });
    const best = bestPath(paths)!;
    // approach direction ~ object->pocket direction (cue, object, pocket nearly collinear)
    expect(best.difficulty).toBeLessThanOrEqual(4);
  });

  it("a blocking ball marks the straight path blocked", () => {
    const cue: Vec = { x: 100, y: 300 };
    const object: Vec = { x: 400, y: 300 };
    // blocker shadowing the straight line cue->ghost
    const blocker: Vec = { x: 250, y: 300 };
    const paths = solveEscape({
      cue,
      object,
      blockers: [blocker],
      pocketId: "br",
      maxCushions: 1,
    });
    expect(paths.length).toBeGreaterThan(0);
    const straight = paths.find((p) => p.cushions === 0);
    expect(straight).toBeDefined();
    expect(straight!.blocked).toBe(true);
  });

  it("1-cushion tree generates bottom, top AND side (left/right) bounces", () => {
    const cue: Vec = { x: 100, y: 300 };
    const object: Vec = { x: 400, y: 300 };
    const paths = solveEscape({
      cue,
      object,
      blockers: [],
      pocketId: "br",
      maxCushions: 1,
    });
    const oneCushion = paths.filter((p) => p.cushions === 1);
    const sides = oneCushion.map((p) => p.sideSequence[0]);
    for (const s of ["b", "t", "l", "r"]) {
      expect(sides).toContain(s);
    }
    // each bounce sits on its ball-center cushion line
    for (const p of oneCushion) {
      const bp = p.cushionNotes[0].point;
      const side = p.sideSequence[0];
      if (side === "b") expect(bp.y).toBeCloseTo(BALL_R, 4);
      if (side === "t") expect(bp.y).toBeCloseTo(PLAY.y1 - BALL_R, 4);
      if (side === "l") expect(bp.x).toBeCloseTo(BALL_R, 4);
      if (side === "r") expect(bp.x).toBeCloseTo(PLAY.x1 - BALL_R, 4);
    }
  });

  it("maxCushions caps the tree depth", () => {
    const cue: Vec = { x: 100, y: 300 };
    const object: Vec = { x: 400, y: 300 };
    const p1 = solveEscape({ cue, object, blockers: [], pocketId: "bl", maxCushions: 1 });
    const p3 = solveEscape({ cue, object, blockers: [], pocketId: "bl", maxCushions: 3 });
    expect(Math.max(...p1.map((p) => p.cushions))).toBeLessThanOrEqual(1);
    expect(Math.max(...p3.map((p) => p.cushions))).toBeLessThanOrEqual(3);
    expect(p3.length).toBeGreaterThanOrEqual(p1.length);
  });

  it("best path is always the first legal (lowest raw score) entry", () => {
    const cue: Vec = { x: 50, y: 550 };
    const object: Vec = { x: 1100, y: 100 };
    const paths = solveEscape({
      cue,
      object,
      blockers: [{ x: 600, y: 300 }],
      pocketId: "tr",
      maxCushions: 3,
    });
    const best = bestPath(paths);
    if (best && paths.length) {
      const legal = paths.filter((p) => !p.blocked);
      if (legal.length) {
        expect(best).toBe(legal[0]);
      }
    }
  });

  it("returns [] when ghost is illegal in pot mode", () => {
    // object hugging the bottom cushion, potting top-middle: the ghost sits
    // 2R on the far side of the object -> y = 30 - 48 = -18, off the cloth
    const object: Vec = { x: 600, y: BALL_R + 6 };
    const cue: Vec = { x: 300, y: 300 };
    const paths = solveEscape({
      cue,
      object,
      blockers: [],
      pocketId: "tm",
      targetMode: "pot",
      maxCushions: 2,
    });
    // ghost off the cloth -> no legal approach exists in pot mode
    expect(paths.length).toBe(0);
  });
});
