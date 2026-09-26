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
  recommendedTip: string;
  recommendedTipNote: string;
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
      ? "แทงตรง: เล็งจุดกึ่งกลางลูกเป้าหมาย (Ghost Ball) สโตรกปล่อยคิวให้ตรง"
      : `แทงแก้ชิ่ง: เล็งไปยังจุดกระทบชิ่งแรก (${sideName(path.sideSequence[0])} Cushion) ตามเส้นนำทาง`;

  // Determine recommended cue tip strike point
  let recommendedTip = "Center";
  let recommendedTipNote = "แทงกลางลูก (Center) — อาศัยมุมตกกระทบธรรมชาติ";

  if (path.cushions > 0 && path.cushionNotes.length > 0) {
    const firstCush = path.cushionNotes[0];
    const side = firstCush.side;
    const fromCue = path.cuePolyline[0];
    const toBounce = firstCush.point;

    // Running english vs check english determination
    if (side === "b") {
      const goingRight = toBounce.x > fromCue.x;
      if (goingRight) {
        recommendedTip = firstCush.angleDeg < 35 ? "LR" : "Right";
        recommendedTipNote = "แทงไซด์ขวา / สกรูขวา (LR) เพื่อขยายมุมชิ่งล่างเข้าหาลูกดำ";
      } else {
        recommendedTip = firstCush.angleDeg < 35 ? "LL" : "Left";
        recommendedTipNote = "แทงไซด์ซ้าย / สกรูซ้าย (LL) เพื่อขยายมุมชิ่งล่างเข้าหาลูกดำ";
      }
    } else if (side === "t") {
      const goingRight = toBounce.x > fromCue.x;
      if (goingRight) {
        recommendedTip = firstCush.angleDeg < 35 ? "HL" : "Left";
        recommendedTipNote = "แทงไซด์ซ้าย (HL / Left) เพื่อขยายมุมชิ่งบนเข้าหาลูกดำ";
      } else {
        recommendedTip = firstCush.angleDeg < 35 ? "HR" : "Right";
        recommendedTipNote = "แทงไซด์ขวา (HR / Right) เพื่อขยายมุมชิ่งบนเข้าหาลูกดำ";
      }
    } else if (side === "l") {
      recommendedTip = toBounce.y > fromCue.y ? "HR" : "LR";
      recommendedTipNote = "แทงไซด์ตามชิ่งซ้ายเพื่อเปิดมุมสะท้อน";
    } else if (side === "r") {
      recommendedTip = toBounce.y > fromCue.y ? "HL" : "LL";
      recommendedTipNote = "แทงไซด์ตามชิ่งขวาเพื่อเปิดมุมสะท้อน";
    }
  } else if (path.cushions === 0) {
    if (aimDistance > 450) {
      recommendedTip = "Low";
      recommendedTipNote = "แทงสกรูถอยหลัง (Low) เพื่อควบคุมระยะการวิ่งของลูกขาว";
    } else {
      recommendedTip = "Center";
      recommendedTipNote = "แทงกลางลูก (Center) เล็งตรงเข้าจุด Ghost Ball";
    }
  }

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
    recommendedTip,
    recommendedTipNote,
  };
}

/** Power suggestion for the user's own attempt (Shot Analyzer replay). */
export function powerForDistance(units: number): number {
  return Math.round(clamp(10 + (units / 1600) * 60, 10, 70));
}
