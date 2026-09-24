import type { SolvePath, Vec } from "./types";
import { sideName } from "./types";
import { dist, normalize, sub, toDeg, angleBetween, clamp } from "./vector";

/**
 * AI Coach — derives teaching cues from a solved path.
 * No AI service: deterministic coaching from the geometry.
 */

export interface CoachBrief {
  aimPoint: Vec;
  aimAngleDeg: number; // from table long axis, 0 = toward top-right
  aimDistance: number;
  /** 0..1, 1 = full ball (straight-on), 0 = pure graze */
  thickness: number;
  thicknessLabel: string;
  powerPct: number;
  powerLabel: string;
  cushionExplanation: string[];
  firstWords: string;
}

export function coachBrief(path: SolvePath, object: Vec, pocket: Vec): CoachBrief {
  const cue = path.cuePolyline[0];
  const first = path.cuePolyline[path.cuePolyline.length === 1 ? 0 : 1];
  const aimPoint = first;
  const dir = normalize(sub(aimPoint, cue));
  const aimAngleDeg = Math.round(toDeg(Math.atan2(dir.y, dir.x)));
  const aimDistance = Math.round(dist(cue, aimPoint));

  // thickness from cut angle: contact offset / ball diameter
  const from = path.cuePolyline[path.cuePolyline.length - 2];
  const to = path.cuePolyline[path.cuePolyline.length - 1];
  const approach = normalize(sub(to, from));
  const objectRun = normalize(sub(pocket, object));
  const cut = angleBetween(approach, objectRun); // 0 = full ball
  const thickness = clamp(1 - cut / (Math.PI / 2), 0, 1);
  const thicknessLabel =
    thickness > 0.8 ? "Full ball (dead centre)"
    : thickness > 0.55 ? "Mid-ball"
    : thickness > 0.3 ? "Quarter-ball cut"
    : thickness > 0.12 ? "Thin cut"
    : "Screwer (edge)";

  // power from total travel (cue + object run)
  let total = 0;
  for (let i = 0; i < path.cuePolyline.length - 1; i++)
    total += dist(path.cuePolyline[i], path.cuePolyline[i + 1]);
  total += dist(object, pocket);
  const powerPct = Math.round(clamp(8 + (total / 1600) * 60, 8, 70));
  const powerLabel =
    powerPct < 25 ? "Soft (feather) — control shots"
    : powerPct < 45 ? "Medium — standard pace"
    : "Firm — long path, keep it flat";

  const cushionExplanation: string[] = path.cushionNotes.map((n) => {
    const side = sideName(n.side);
    const along = n.side === "l" || n.side === "r" ? n.point.y / 600 : n.point.x / 1200;
    const posPct = Math.round(along * 100);
    return `${side} cushion @ ${posPct}% of the cushion — meet it at ${Math.round(
      n.angleDeg
    )}° off the face, rebound roughly at the same angle (mirror law).`;
  });

  const firstWords =
    path.cushions === 0
      ? "Straight shot: aim at the ghost ball centre, drive through contact."
      : `Cushion escape: first aim at the bounce marker ${
          path.cushionNotes[0]
            ? `(${path.cushionNotes[0].side === "b" ? "bottom" : "top"} cushion)`
            : ""
        } — the mirror does the rest.`;

  return {
    aimPoint,
    aimAngleDeg,
    aimDistance,
    thickness,
    thicknessLabel,
    powerPct,
    powerLabel,
    cushionExplanation,
    firstWords,
  };
}

/** Power suggestion for the user's own attempt (Shot Analyzer replay). */
export function powerForDistance(units: number): number {
  return Math.round(clamp(10 + (units / 1600) * 60, 10, 70));
}
