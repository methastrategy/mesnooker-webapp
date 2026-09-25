/**
 * Mesnooker Coach Engine — shared types.
 * Pure data, no UI dependencies. All coordinates are in TABLE UNITS
 * (12ft x 6ft table scaled so PLAY_X = 1200, PLAY_Y = 600).
 */

export type BallColor =
  | "red"
  | "yellow"
  | "green"
  | "brown"
  | "blue"
  | "pink"
  | "black"
  | "cue";

export interface Vec {
  x: number;
  y: number;
}

/** A ball sitting on the coach table. */
export interface Ball {
  id: string;
  color: BallColor;
  pos: Vec;
}

export interface PocketDef {
  id: string;
  name: string;
  pos: Vec;
  r: number;
}

/**
 * Which cushion line a mirrored path flips across:
 * "b" = bottom, "t" = top, "l" = left (baulk), "r" = right (head).
 */
export type Side = "b" | "t" | "l" | "r";

export function sideName(s: Side): string {
  return s === "b" ? "Bottom" : s === "t" ? "Top" : s === "l" ? "Left" : "Right";
}

export interface CounselNote {
  /** 1-based cushion index in the sequence */
  index: number;
  side: Side;
  point: Vec;
  /** approach angle off the cushion face (deg, 0 = grazing) */
  angleDeg: number;
}

export interface SolvePath {
  id: string;
  pocketId: string;
  /** number of cushion bounces (0 = straight) */
  cushions: number;
  sideSequence: Side[];
  /** cue travel polyline: cue -> bounces... -> ghost */
  cuePolyline: Vec[];
  /** ghost ball centre at the moment of contact */
  ghost: Vec;
  /** object ball run: ghost -> pocket */
  objectPolyline: Vec[];
  /** unit-ish metadata */
  totalLength: number;
  /** 1..10, higher = harder */
  difficulty: number;
  /** 0..1 ranking quality (best = lowest; raw pre-scale) */
  rawScore: number;
  cushionNotes: CounselNote[];
  blocked: boolean;
  /** reason when blocked: e.g. "blocked by red" / "no clear pocket" */
  blockReason?: string;
}

export interface SolverInput {
  cue: Vec;
  object: Vec;
  blockers: Vec[];
  pocketId: string;
  /** "hit" = escape to hit target ball, "pot" = pot into pocket */
  targetMode?: "hit" | "pot";
  /** min cushions to attempt (0..6) */
  minCushions?: number;
  /** max cushions to attempt (0..6) */
  maxCushions: number;
}

export interface Drill {
  id: string;
  name: string;
  createdAt: number;
  kind: "safety" | "escape" | "thin" | "position";
  difficulty: number; // 1..10
  cue: Vec;
  object: Ball;
  pocketId: string;
  others: Ball[];
  note?: string;
}

export interface ShotAnalysis {
  errorAngleDeg: number;
  /** signed perpendicular offset of actual aim vs ideal aim, in ball radii */
  contactOffsetRadii: number;
  /** unit vector of the user's aim line */
  aimDir: Vec;
  /** aim point on table (endpoint of user line) */
  aimPoint: Vec;
}
