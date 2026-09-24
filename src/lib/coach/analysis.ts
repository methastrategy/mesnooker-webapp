import type { SolvePath, Vec } from "@/lib/geometry";
import {
  BALL_R,
  POCKET_MAP,
  angleBetween,
  dist,
  normalize,
  sub,
  toDeg,
  cross2,
} from "@/lib/geometry";

export interface ShotVerdict {
  errorAngleDeg: number;
  /** signed offset of the ideal ghost centre from the user's aim line, in ball radii (+ = right of travel) */
  contactOffsetRadii: number;
  /** will the cue actually reach the object ball along the user's line? */
  willContact: boolean;
  /** distance along the user's line to first contact with the object (units) */
  contactDist: number;
  verdict: string;
}

/**
 * Shot Analyzer — compare the user's aim line with the engine's best path.
 * error angle = deviation between the user's first direction and the
 * ideal first direction; contact offset = how far off the ideal ghost
 * centre the user's line passes.
 */
export function analyzeShot(
  cue: Vec,
  userAimEnd: Vec,
  best: SolvePath,
  object: Vec
): ShotVerdict {
  const idealTarget = best.cushionNotes.length
    ? best.cushionNotes[0].point
    : best.ghost;
  const idealDir = normalize(sub(idealTarget, cue));
  const userDir = normalize(sub(userAimEnd, cue));

  const errorAngleDeg = toDeg(angleBetween(idealDir, userDir));

  // signed perpendicular distance from ideal ghost to the user's line
  const rel = sub(best.ghost, cue);
  const offset = cross2(userDir, rel) / BALL_R;

  // where does the user's line meet the object ball?
  const toObj = sub(object, cue);
  const proj = userDir.x * toObj.x + userDir.y * toObj.y;
  const perp = Math.abs(cross2(userDir, toObj));
  const reach = Math.abs(proj) > BALL_R && perp < 2 * BALL_R;
  const contactDist = Math.max(0, proj - Math.sqrt(Math.max(0, (2 * BALL_R) ** 2 - perp * perp)));

  const pocket = POCKET_MAP[best.pocketId];
  const verdict =
    errorAngleDeg < 2
      ? "On the money — that's the engine's line."
      : errorAngleDeg < 6
        ? "Close. Small correction: " + (offset > 0 ? "open it up (move aim right of travel)" : "shut it down (move aim left of travel)") + "."
        : errorAngleDeg < 15
          ? "Off line. The ghost ball is not on your aim line — re-aim at the marker."
          : `Big error (${Math.round(errorAngleDeg)}°). ${pocket ? "Think mirror: " + cushionWords(best.cushionNotes) : "Re-solve the escape."}`;

  return {
    errorAngleDeg: Math.round(errorAngleDeg * 10) / 10,
    contactOffsetRadii: Math.round(offset * 100) / 100,
    willContact: reach,
    contactDist: Math.round(contactDist),
    verdict,
  };
}

function cushionWords(notes: { side: "b" | "t"; angleDeg: number }[]): string {
  if (!notes.length) return "it's a straight drive through the ghost ball.";
  const first = notes[0];
  return `send it to the ${first.side === "b" ? "bottom" : "top"} cushion ~${Math.round(first.angleDeg)}° off the face`;
}

export { dist };
