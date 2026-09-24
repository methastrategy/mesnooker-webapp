import type { Ball, BallColor, Drill, Vec } from "@/lib/geometry";
import {
  PLAY,
  BALL_R,
  POCKETS,
  BAULK_SPOT,
  ghostBall,
  solveEscape,
  clampToTable,
} from "@/lib/geometry";
import { uid } from "@/lib/utils";

export type DrillKind = Drill["kind"];

/**
 * Practice Generator — builds random drills for 4 drill types at
 * difficulty 1–10. Every generated drill is verified with the real solver
 * so it always has at least one legal escape/pot route.
 */

function rand(lo: number, hi: number) {
  return lo + Math.random() * (hi - lo);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeBall(color: BallColor, pos: Vec): Ball {
  return { id: uid(), color, pos: clampToTable(pos, [], BALL_R) };
}

/** verify a drill pose is solvable with <= 6 cushions */
function solvable(cue: Vec, object: Vec, blockers: Vec[], pocketId: string): boolean {
  const paths = solveEscape({ cue, object, blockers, pocketId, maxCushions: 6 });
  return paths.some((p) => !p.blocked);
}

interface Pose {
  cue: Vec;
  object: Ball;
  others: Ball[];
  pocketId: string;
}

function randomTablePos(lo = 120, hi?: number): Vec {
  return { x: rand(lo, hi ?? PLAY.x1 - 120), y: rand(80, PLAY.y1 - 80) };
}

/** ESCAPE: a blocker shadows the straight line cue→ghost. */
function escapePose(d: number): Pose | null {
  const pocket = pick(POCKETS);
  const objBall = makeBall(pick(["red", "black", "pink"] as BallColor[]), randomTablePos(300));
  const g = ghostBall(objBall.pos, pocket.pos);
  // cue well back from the ghost
  const cue = randomTablePos(150);
  const between = {
    x: cue.x + (g.x - cue.x) * rand(0.35, 0.75),
    y: cue.y + (g.y - cue.y) * rand(0.35, 0.75),
  };
  const blockers = [makeBall("red", between)];
  if (d >= 5) {
    // second shadow ball: float it off the object's run line (lateral offset)
    // so the pot stays open but extra cushion routes get crowded.
    const t = 0.45;
    const midX = cue.x + (g.x - cue.x) * t;
    const midY = cue.y + (g.y - cue.y) * t;
    const dx = g.x - cue.x;
    const dy = g.y - cue.y;
    const dl = Math.hypot(dx, dy) || 1;
    const off = (Math.random() < 0.5 ? 1 : -1) * rand(140, 240);
    blockers.push(
      makeBall(pick(["yellow", "green", "brown"] as BallColor[]), {
        x: midX + (-dy / dl) * off,
        y: midY + (dx / dl) * off,
      })
    );
  }
  const p = { cue, object: objBall, others: blockers, pocketId: pocket.id };
  return solvable(cue, objBall.pos, blockers.map((b) => b.pos), pocket.id) ? p : null;
}

/** THIN CONTACT: object near the pocket, cue placed for a 45–85° cut. */
function thinPose(d: number): Pose | null {
  const pocket = pick(POCKETS);
  const runLen = rand(380, 560);
  const ang = rand(0, Math.PI * 2);
  const obj = makeBall("red", {
    x: pocket.pos.x + Math.cos(ang) * runLen,
    y: pocket.pos.y + Math.sin(ang) * (runLen * 0.55),
  });
  const pos = clampToTable(obj.pos, [], BALL_R);
  if (Math.hypot(pos.x - pocket.pos.x, pos.y - pocket.pos.y) > 700) return null;
  const g = ghostBall(pos, pocket.pos);

  // desired cut angle grows with difficulty
  const cut = ((45 + d * 4.5) * Math.PI) / 180;
  const runDir = { x: pocket.pos.x - pos.x, y: pocket.pos.y - pos.y };
  const l = Math.hypot(runDir.x, runDir.y) || 1;
  const u = { x: runDir.x / l, y: runDir.y / l };
  // cue sits on the far side of the ghost, rotated by the cut angle
  const dirA = Math.atan2(u.y, u.x) + Math.PI + (Math.random() < 0.5 ? cut : -cut);
  const cueDist = rand(320, 520);
  const cue = { x: g.x + Math.cos(dirA) * cueDist, y: g.y + Math.sin(dirA) * cueDist };
  const cp = clampToTable(cue, [obj], BALL_R);
  const p = { cue: cp, object: { ...obj, pos }, others: [], pocketId: pocket.id };
  return solvable(cp, pos, [], pocket.id) ? p : null;
}

/** SAFETY: cue boxed in, only cushion routes stay open. */
function safetyPose(d: number): Pose | null {
  const pocket = pick(POCKETS);
  const objBall = makeBall("black", randomTablePos(320));
  const g = ghostBall(objBall.pos, pocket.pos);
  const cue = randomTablePos(150);
  const blockers: Ball[] = [];
  const n = 1 + Math.floor(d / 4); // 1..3 shadowing balls
  for (let i = 0; i < n; i++) {
    const t = (i + 1) / (n + 1);
    blockers.push(
      makeBall(pick(["red", "red", "blue", "pink"] as BallColor[]), {
        x: cue.x + (g.x - cue.x) * t + rand(-90, 90),
        y: cue.y + (g.y - cue.y) * t + rand(-70, 70),
      })
    );
  }
  const p = { cue, object: objBall, others: blockers, pocketId: pocket.id };
  return solvable(cue, objBall.pos, blockers.map((b) => b.pos), pocket.id) ? p : null;
}

/** POSITION: pot the object off baulk, keep it central (0–2 blockers). */
function positionPose(d: number): Pose | null {
  const pocket = pick(POCKETS.filter((p) => p.kind === "corner"));
  const objBall = makeBall(pick(["blue", "pink", "black"] as BallColor[]), {
    x: rand(PLAY.x1 * 0.45, PLAY.x1 * 0.8),
    y: rand(140, PLAY.y1 - 140),
  });
  const cue = { ...BAULK_SPOT, x: BAULK_SPOT.x + rand(-60, 60) };
  const blockers: Ball[] = [];
  if (d >= 5) blockers.push(makeBall("red", randomTablePos(500)));
  if (d >= 8) blockers.push(makeBall("red", randomTablePos(400)));
  const p = {
    cue,
    object: objBall,
    others: blockers,
    pocketId: pocket.id,
  };
  return solvable(cue, objBall.pos, blockers.map((b) => b.pos), pocket.id) ? p : null;
}

export function generateDrill(kind: DrillKind, difficulty: number): Drill | null {
  const maker =
    kind === "escape" ? escapePose
    : kind === "thin" ? thinPose
    : kind === "safety" ? safetyPose
    : positionPose;
  for (let i = 0; i < 40; i++) {
    const pose = maker(difficulty);
    if (pose) {
      return {
        id: uid(),
        name: `${kindLabel(kind)} D${difficulty}`,
        createdAt: Date.now(),
        kind,
        difficulty,
        cue: pose.cue,
        object: pose.object,
        pocketId: pose.pocketId,
        others: pose.others,
      };
    }
  }
  return null;
}

export function kindLabel(k: DrillKind): string {
  return k === "escape" ? "Escape" : k === "thin" ? "Thin Contact" : k === "safety" ? "Safety" : "Position";
}

// ── storage (localStorage, coach module only) ──────────────────────────

const KEY = "mesnooker-coach-drills-v1";
const HANDOFF_KEY = "mesnooker-coach-handoff-v1";

export function savedDrills(): Drill[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Drill[]) : [];
  } catch {
    return [];
  }
}

export function saveDrill(d: Drill): void {
  if (typeof window === "undefined") return;
  const list = savedDrills().filter((x) => x.id !== d.id);
  list.unshift(d);
  window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
}

export function deleteDrill(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(savedDrills().filter((x) => x.id !== id)));
}

/** hand a drill off to the solver page (survives the route change) */
export function handOffDrill(d: Drill): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(d));
}

export function takeHandOffDrill(): Drill | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(HANDOFF_KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(HANDOFF_KEY);
  try {
    return JSON.parse(raw) as Drill;
  } catch {
    return null;
  }
}
