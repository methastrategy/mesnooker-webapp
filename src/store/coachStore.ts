"use client";

/**
 * Mesnooker Coach Engine — module store.
 * Deliberately SEPARATE from gameStore so the Score / Money Tracker is
 * never touched. No persistence: practice is ephemeral (drills are shared
 * as JSON, not written to the game store).
 */
import { create } from "zustand";
import type { Ball, BallColor, SolvePath, Vec } from "@/lib/geometry";
import {
  BALL_R,
  PLAY,
  POCKETS,
  clampToTable,
  SPOTS,
} from "@/lib/geometry";
import { solveEscape } from "@/lib/geometry";
import { uid } from "@/lib/utils";

export type DrillKind = "safety" | "escape" | "thin" | "position";

const CUE_ID = "cue";
export const BLACK_TARGET_ID = "target-black";

function makeBall(color: BallColor, pos: Vec, id?: string): Ball {
  return { id: id ?? uid(), color, pos: { ...pos } };
}

/** A clean default table: cue on baulk, target locked on the black ball,
 *  with blockers to simulate snooker situations. */
function initialTable(): Ball[] {
  const balls: Ball[] = [];
  balls.push(makeBall("cue", { x: 330, y: PLAY_H_CENTRE }, CUE_ID));
  balls.push(makeBall("black", { ...SPOTS.black }, BLACK_TARGET_ID));
  balls.push(makeBall("red", { x: 720, y: 240 }));
  balls.push(makeBall("red", { x: 780, y: 360 }));
  balls.push(makeBall("blue", { ...SPOTS.blue }));
  return balls;
}
const PLAY_H_CENTRE = PLAY.y1 / 2;

export interface CueSpin {
  side: number; // -1 (Left) to +1 (Right)
  vertical: number; // -1 (Low/Screw) to +1 (High/Follow)
}

export interface CoachState {
  balls: Ball[];
  objectId: string;
  pocketId: string;
  maxCushions: number;
  paths: SolvePath[];
  selectedPathId: string | null;
  hintLevel: number; // 0 off, 1 aim, 2 ghost, 3 full
  solved: boolean;
  showGrid: boolean;
  targetMode: "hit" | "pot";
  spin: CueSpin;

  // selectors
  cue: () => Ball | undefined;
  object: () => Ball | undefined;
  blockers: () => Ball[];

  // actions
  moveBall: (id: string, pos: Vec, skipSolve?: boolean) => void;
  setObjectBall: (id: string) => void;
  setPocket: (id: string) => void;
  setMaxCushions: (n: number) => void;
  setTargetMode: (m: "hit" | "pot") => void;
  setSpin: (spin: CueSpin) => void;
  setShowGrid: (v: boolean) => void;
  toggleGrid: () => void;
  addBall: (color: BallColor) => void;
  removeBall: (id: string) => void;
  solve: () => void;
  selectPath: (id: string | null) => void;
  setHint: (n: number) => void;
  reset: () => void;
  /** load a shared/pasted drill JSON */
  loadDrill: (d: {
    cue: Vec;
    object: Ball;
    others: Ball[];
    pocketId: string;
  }) => void;
}

const INITIAL_BALLS = initialTable();

export const useCoachStore = create<CoachState>()((set, get) => ({
  balls: INITIAL_BALLS,
  objectId: BLACK_TARGET_ID, // Black ball is PERMANENTLY the target ball
  pocketId: "br",
  maxCushions: 3,
  paths: [],
  selectedPathId: null,
  hintLevel: 1,
  solved: false,
  showGrid: false,
  targetMode: "hit",
  spin: { side: 0, vertical: 0 },

  cue: () => get().balls.find((b) => b.id === CUE_ID),
  object: () => get().balls.find((b) => b.id === BLACK_TARGET_ID) ?? get().balls.find((b) => b.color === "black"),
  blockers: () =>
    get().balls.filter((b) => b.id !== CUE_ID && b.id !== BLACK_TARGET_ID && b.color !== "black"),

  moveBall: (id, pos, skipSolve = false) => {
    const r = BALL_R;
    const others = get().balls.filter((b) => b.id !== id);
    const clamped = clampToTable(pos, others, r);
    set((s) => ({
      balls: s.balls.map((b) => (b.id === id ? { ...b, pos: clamped } : b)),
    }));
    if (!skipSolve) {
      get().solve();
    }
  },

  setObjectBall: (_id) => {
    // Target is locked to the Black ball
    set({ objectId: BLACK_TARGET_ID });
    get().solve();
  },

  setPocket: (id) => {
    set({ pocketId: id });
    get().solve();
  },

  setMaxCushions: (n) => {
    set({ maxCushions: Math.max(0, Math.min(6, n)) });
    get().solve();
  },

  setTargetMode: (m) => {
    set({ targetMode: m });
    get().solve();
  },

  setSpin: (spin) => {
    set({ spin });
    get().solve();
  },

  setShowGrid: (v) => set({ showGrid: v }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

  addBall: (color) => {
    const s = get();
    if (s.balls.length >= 14) return;
    // Disallow adding a second black ball; other colors are blocker balls
    const safeColor = color === "black" ? "red" : color;
    const jitter = () => 200 + Math.random() * 800;
    const p = clampToTable({ x: jitter(), y: 80 + Math.random() * 440 }, s.balls);
    set({ balls: [...s.balls, makeBall(safeColor, p)] });
    get().solve();
  },

  removeBall: (id) => {
    // Cue ball and Black target ball cannot be removed
    if (id === CUE_ID || id === BLACK_TARGET_ID) return;
    const s = get();
    const ballToRemove = s.balls.find((b) => b.id === id);
    if (ballToRemove?.color === "black") return;

    const remaining = s.balls.filter((b) => b.id !== id);
    set({
      balls: remaining,
      objectId: BLACK_TARGET_ID,
    });
    get().solve();
  },

  solve: () => {
    const s = get();
    const cue = s.balls.find((b) => b.id === CUE_ID);
    const obj = s.balls.find((b) => b.id === BLACK_TARGET_ID) ?? s.balls.find((b) => b.color === "black");
    if (!cue || !obj) {
      set({ paths: [], selectedPathId: null, solved: false });
      return;
    }
    const blockers = s.balls
      .filter((b) => b.id !== CUE_ID && b.id !== obj.id)
      .map((b) => b.pos);
    const paths = solveEscape({
      cue: cue.pos,
      object: obj.pos,
      blockers,
      pocketId: s.pocketId,
      targetMode: s.targetMode,
      maxCushions: s.maxCushions,
      spin: s.spin,
    });
    // pick best non-blocked
    const best = paths.find((p) => !p.blocked) ?? paths[0];
    set({
      paths,
      selectedPathId: best ? best.id : null,
      solved: true,
    });
  },

  selectPath: (id) => set({ selectedPathId: id }),
  setHint: (n) => set({ hintLevel: Math.max(0, Math.min(3, n)) }),

  reset: () => {
    const balls = initialTable();
    set({
      balls,
      objectId: balls[1].id,
      pocketId: "br",
      maxCushions: 3,
      paths: [],
      selectedPathId: null,
      hintLevel: 1,
      solved: false,
    });
    get().solve();
  },

  loadDrill: (d) => {
    const cue = makeBall("cue", d.cue, CUE_ID);
    const obj = { ...d.object, id: d.object.id || uid() };
    const others = (d.others ?? []).map((b) => ({ ...b, id: b.id || uid() }));
    set({
      balls: [cue, obj, ...others],
      objectId: obj.id,
      pocketId: d.pocketId || POCKETS[0].id,
      paths: [],
      selectedPathId: null,
      solved: false,
    });
    get().solve();
  },
}));

export const COACH_CUE_ID = CUE_ID;
