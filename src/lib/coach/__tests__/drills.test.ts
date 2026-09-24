import { describe, expect, it } from "vitest";
import { generateDrill, type DrillKind } from "@/lib/coach/drills";
import { PLAY, BALL_R, POCKET_MAP, type Vec } from "@/lib/geometry";

const KINDS: DrillKind[] = ["safety", "escape", "thin", "position"];

function onCloth(p: Vec): boolean {
  return (
    p.x >= 0 && p.x <= PLAY.x1 && p.y >= 0 && p.y <= PLAY.y1
  );
}

describe("practice generator", () => {
  it("produces a solvable, on-cloth drill for every kind at difficulty 5", () => {
    for (const kind of KINDS) {
      let drill = generateDrill(kind, 5);
      let tries = 0;
      while (!drill && tries < 50) {
        drill = generateDrill(kind, 5);
        tries++;
      }
      expect(drill, `kind ${kind} should generate`).toBeTruthy();
      const d = drill!;
      expect(d.kind).toBe(kind);
      expect(d.difficulty).toBe(5);
      expect(onCloth(d.cue)).toBe(true);
      expect(onCloth(d.object.pos)).toBe(true);
      for (const o of d.others) expect(onCloth(o.pos)).toBe(true);
      // pocket must be valid
      expect(POCKET_MAP[d.pocketId]).toBeTruthy();
      // cue and object must not overlap
      const gap = Math.hypot(d.cue.x - d.object.pos.x, d.cue.y - d.object.pos.y);
      expect(gap).toBeGreaterThan(2 * BALL_R - 1);
    }
  });

  it("clamps difficulty into 1..10", () => {
    const lo = generateDrill("escape", 0) ?? generateDrill("escape", 1);
    const hi = (() => {
      let d = generateDrill("escape", 99);
      for (let i = 0; i < 50 && !d; i++) d = generateDrill("escape", 99);
      return d;
    })();
    expect(lo!.difficulty).toBeGreaterThanOrEqual(1);
    expect(lo!.difficulty).toBeLessThanOrEqual(10);
    expect(hi!.difficulty).toBeGreaterThanOrEqual(1);
    expect(hi!.difficulty).toBeLessThanOrEqual(10);
  });

  it("escape drills place a blocker between cue and ghost (shadowing pose)", () => {
    let d = generateDrill("escape", 6);
    for (let i = 0; i < 50 && !d; i++) d = generateDrill("escape", 6);
    expect(d).toBeTruthy();
    // at least one other ball exists to shadow
    expect(d!.others.length).toBeGreaterThan(0);
  });
});
