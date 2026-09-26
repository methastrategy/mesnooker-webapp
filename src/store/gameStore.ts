"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BALL_ORDER,
  BALL_START,
  ballValue,
  BreakPhase,
  buildTargetCycle,
  FOUL_VALUES,
  inferBreakPhase,
  pottedBallsPerPlayer,
  SNOOKER_MISS_VALUES,
} from "@/lib/rules";
import {
  computeFrameMoney,
  mergeRunning,
  type MoneyResult,
} from "@/lib/money";
import type {
  ArchivedFrame,
  ArchivedGame,
  BallColor,
  BallCounts,
  FrameSnapshot,
  GameEvent,
  GameMode,
  MoneyRateUnit,
  Player,
  SessionSummary,
} from "@/types";

let uid = 0;
const nid = () => `${Date.now().toString(36)}_${(uid++).toString(36)}`;

/** True when ONLY the black ball remains on the table (no reds, no other colours) */
function isOnlyBlackLeft(counts: BallCounts): boolean {
  return (
    counts.black > 0 &&
    counts.red === 0 &&
    counts.yellow === 0 &&
    counts.green === 0 &&
    counts.brown === 0 &&
    counts.blue === 0 &&
    counts.pink === 0
  );
}

/** Build the new player order for the next frame.
 *  Rule: opener (who potted/fouled black) = index 0;
 *  remaining players are taken in REVERSE of current order.
 *  e.g. [A,B,C] C opens → [C, B, A];
 *       [C,B,A] B opens → [B, A, C] (remaining [C,A] reversed = [A,C]). */
function buildNextFrameOrder(players: Player[], openerIndex: number): Player[] {
  const opener = players[openerIndex];
  const rest = players.filter((_, i) => i !== openerIndex).reverse();
  return [opener, ...rest];
}
export interface PottedEvent extends GameEvent {
  ball: BallColor;
}

function initialCounts(redCount: number = 15): BallCounts {
  return { ...BALL_START, red: redCount, yellow: 1, green: 1, brown: 1, blue: 1, pink: 1, black: 1 };
}
function emptyScores(players: Player[]): Record<string, number> {
  return Object.fromEntries(players.map((p) => [p.id, 0]));
}
function buildCycle(players: Player[]): Record<string, string> {
  const idx = buildTargetCycle(players.length);
  const cycle: Record<string, string> = {};
  players.forEach((p, i) => (cycle[p.id] = players[idx[i]].id));
  return cycle;
}
function makeFrame(players: Player[], mode: GameMode): FrameSnapshot {
  return {
    id: nid(),
    startedAt: Date.now(),
    mode,
    scores: emptyScores(players),
    money: {},
    breaks: emptyScores(players),
    fouls: emptyScores(players),
    snookerMisses: emptyScores(players),
    snookerHits: emptyScores(players),
    targetCycle: buildCycle(players),
    eventIds: [],
    highestBreak: 0,
  };
}

interface PersistShape {
  session: SessionSummary | null;
  players: Player[];
  mode: GameMode;
  moneyRate: number;
  moneyPer: MoneyRateUnit;
  ballCounts: BallCounts;
  shooterIndex: number;
  reverse: boolean;
  sound: boolean;
  haptics: boolean;
  theme: string;
  locale: "th" | "en";
  frames: FrameSnapshot[];
  events: GameEvent[];
  startCounts: BallCounts;
  history: ArchivedGame[];
  /** undo/redo stacks (in-memory only, not persisted) */
  undoStack: StateSnapshot[];
  redoStack: StateSnapshot[];
}

interface GameStore extends PersistShape {
  startSession: (o: { players: Player[]; mode: GameMode; moneyRate: number; moneyPer: MoneyRateUnit; redCount: number; tableFee?: number }) => void;
  endSession: () => SessionSummary | null;
  /** archive the finished game into history and reset to a blank slate (back to setup) */
  archiveAndReset: () => ArchivedGame | null;
  setMode: (m: GameMode) => void;
  setMoneyRate: (r: number) => void;
  setMoneyPer: (u: MoneyRateUnit) => void;
  pot: (ball: BallColor) => void;
  foul: () => void;
  snookerMiss: () => void;
  snookerHit: () => void;
  /** one composite scoring action (foul/miss/solve) that ALSO auto-advances the
   *  turn, so a single Undo reverts the whole "wrong press" to before it */
  applyScoring: (kind: "foul" | "miss" | "solve") => void;
  endTurn: () => void;
  undo: () => void;
  redo: () => void;
  setShooterManual: (idx: number) => void;
  toggleReverse: () => void;
  skipPlayer: () => void;
  endFrame: () => void;
  /** End the frame AND record who should open next frame (auto-end on black ball). */
  endFrameWithOpener: (openerIndex: number) => void;
  newFrame: () => void;
  renamePlayer: (id: string, nickname: string) => void;
  toggleSound: () => void;
  toggleHaptics: () => void;
  setTheme: (theme: string) => void;
  setLocale: (locale: "th" | "en") => void;
  setActiveFrameId: () => void;
  /** settings popup (global) */
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  /** apply (or clear) the table fee to an archived game's balances; fee split evenly */
  setArchivedTableFee: (gameId: string, fee: number) => void;
}

/** A full state snapshot used for undo/redo. Deep-copied because frames/events
 *  are mutated in place; the snapshot must capture the full story so Undo can
 *  truly return to the instant before a wrong press. */
export interface StateSnapshot {
  events: GameEvent[];
  frames: FrameSnapshot[];
  ballCounts: BallCounts;
  shooterIndex: number;
  session: SessionSummary | null;
  reverse: boolean;
}

const MAX_HISTORY = 60;

function cloneSnapshot(st: PersistShape): StateSnapshot {
  return {
    events: JSON.parse(JSON.stringify(st.events)) as GameEvent[],
    frames: JSON.parse(JSON.stringify(st.frames)) as FrameSnapshot[],
    ballCounts: { ...st.ballCounts },
    shooterIndex: st.shooterIndex,
    session: st.session ? (JSON.parse(JSON.stringify(st.session)) as SessionSummary) : null,
    reverse: st.reverse,
  };
}

/** Record the current state on the undo stack (and clear redo, since the
 *  timeline forks). Call BEFORE mutating state. Mutates `st` in place so the
 *  caller includes the updated stacks in the following set(). */
function pushUndo(st: PersistShape) {
  st.undoStack.push(cloneSnapshot(st));
  if (st.undoStack.length > MAX_HISTORY) st.undoStack.shift();
  st.redoStack = [];
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      session: null,
      players: [],
      mode: "points",
      moneyRate: 1,
      moneyPer: "point",
      ballCounts: initialCounts(),
      shooterIndex: 0,
      reverse: false,
      sound: true,
      haptics: true,
      theme: "mono",
      locale: "th",
      frames: [],
      events: [],
      startCounts: initialCounts(),
      history: [],
      undoStack: [],
      redoStack: [],
      settingsOpen: false,

      startSession: ({ players, mode, moneyRate, moneyPer, redCount = 15, tableFee = 0 }) => {
        if (players.length < 2) return;
        const id = nid();
        const frame = makeFrame(players, mode);
        const session: SessionSummary = {
          id,
          createdAt: Date.now(),
          mode,
          moneyRate,
          moneyPer,
          tableFee,
          redCount,
          players,
          frameIds: [frame.id],
          runningBalance: emptyScores(players),
          activeFrameId: frame.id,
          status: "live",
        };
        const counts = initialCounts(redCount);
        set({
          session,
          players,
          mode,
          moneyRate,
          moneyPer,
          undoStack: [],
          redoStack: [],
          settingsOpen: false,
          ballCounts: counts,
          startCounts: counts,
          shooterIndex: 0,
          reverse: false,
          frames: [frame],
          events: [],
        });
      },

      endSession: () => {
        const { session, frames } = get();
        if (!session) return null;
        const f = frames[frames.length - 1];
        if (f && !f.endedAt) f.endedAt = Date.now();
        set({ frames: [...frames], session: { ...session, status: "ended" } });
        return { ...session, status: "ended" };
      },

      archiveAndReset: () => {
        const st = get();
        if (!st.session) return null;
        // finalize active frame (settle money into running balance as endFrame does)
        const f = st.frames[st.frames.length - 1];
        let currentNet: Record<string, number> | null = null;
        if (f && !f.endedAt) {
          // An un-ended frame (e.g. mid-play) gets ended now. Its money is then
          // merged below. Frames already ended via endFrame() had their money
          // merged into runningBalance at that time, so we must NOT add again.
          const frameEvents = st.events.filter((e) => e.frameId === f.id && !e.undone);
          const money: MoneyResult = computeFrameMoney({
            mode: f.mode,
            players: st.players,
            scores: f.scores,
            ballCounts: Object.fromEntries(
              st.players.map((p) => [p.id, pottedBallsPerPlayer(frameEvents, p.id)])
            ),
            targetCycle: f.targetCycle,
            moneyPer: st.moneyPer,
            moneyRate: st.moneyRate,
          });
          f.money = money.net;
          f.endedAt = Date.now();
          currentNet = money.net;
        }
        // merge the last frame's net into the running balance
        const running = currentNet
          ? mergeRunning(st.session.runningBalance, currentNet)
          : st.session.runningBalance;
        const totalPoints = st.frames.reduce(
          (s, fr) =>
            s +
            Object.values(fr.scores).reduce((x, y) => x + (y > 0 ? y : 0), 0),
          0
        );
        // rawBalances = winnings before any table fee. The fee itself is decided
        // AFTER the game ends (at the summary), so archive with fee 0 here and let
        // setArchivedTableFee recompute the net from rawBalances later.
        // Per-frame snapshot so History can drill into each frame separately.
        const frameDetails: ArchivedFrame[] = st.frames.map((fr, i) => {
          const frameEvents = st.events.filter(
            (e) => e.frameId === fr.id && !e.undone
          );
          const potted: Record<string, BallCounts> = {};
          const totalPotted: BallCounts = {
            red: 0, yellow: 0, green: 0, brown: 0, blue: 0, pink: 0, black: 0,
          };
          for (const p of st.players) {
            const pc = pottedBallsPerPlayer(frameEvents, p.id);
            potted[p.id] = pc;
            for (const c of BALL_ORDER) totalPotted[c] += pc[c];
          }
          return {
            index: i,
            startedAt: fr.startedAt,
            endedAt: fr.endedAt,
            mode: fr.mode,
            scores: { ...fr.scores },
            money: { ...(fr.money ?? {}) },
            winnerId: fr.winnerId,
            highestBreak: fr.highestBreak,
            breaks: { ...fr.breaks },
            fouls: { ...fr.fouls },
            snookerMisses: { ...fr.snookerMisses },
            snookerHits: { ...fr.snookerHits },
            potted,
            totalPotted,
          };
        });
        const archived: ArchivedGame = {
          id: nid(),
          endedAt: Date.now(),
          mode: st.session.mode,
          moneyRate: st.session.moneyRate,
          moneyPer: st.session.moneyPer,
          redCount: st.session.redCount,
          tableFee: st.session.tableFee,
          players: st.players.map((p) => ({ ...p })),
          rawBalances: { ...running },
          balances: { ...running },
          frames: st.frames.length,
          totalPoints,
          frameDetails,
        };
        set({
          history: [archived, ...st.history],
          session: null,
          players: [],
          frames: [],
          events: [],
          ballCounts: initialCounts(),
          startCounts: initialCounts(),
          shooterIndex: 0,
          undoStack: [],
          redoStack: [],
          settingsOpen: false,
        });
        return archived;
      },
      setMode: (mode) => set({ mode }),
      setMoneyRate: (moneyRate) => set({ moneyRate }),
      setMoneyPer: (moneyPer) => set({ moneyPer }),

      pot: (ball) => {
        const st = get();
        const f = st.frames[st.frames.length - 1];
        if (!f || !st.session) return;
        const value = ballValue(ball, f.mode);
        const scorer = st.players[st.shooterIndex];
        if (!scorer) return;
        const counts = { ...st.ballCounts };
        // TURN BOUNDARY BEHAVIOUR — a pot is the start of a fresh undoable step.
        pushUndo(st);

        // Re-spotting rule (USER-CONFIRMED):
        // - A RED pot is always consumed (removed from the table).
        // - A COLOUR pot RE-SPOTS (put back up) while any red remains on the
        //   table AND while the shooter is still in their COLOUR phase — the
        //   colour stays pressable so it can be potted again. A colour is only
        //   actually removed once reds are gone AND the phase has cycled back
        //   to RED_FIRST (ordered clear: yellow → … → black).
        const frameEvents = st.events.filter((e) => e.frameId === f.id && !e.undone);
        const phase = inferBreakPhase(frameEvents, scorer.id);
        if (ball === "red") {
          if (counts.red > 0) counts.red -= 1;
        } else {
          const clearing = counts.red === 0 && phase === BreakPhase.RED_FIRST;
          if (clearing && counts[ball] > 0) counts[ball] -= 1;
        }

        const evt: PottedEvent = {
          id: nid(),
          ts: Date.now(),
          playerId: scorer.id,
          playerName: scorer.nickname,
          targetId: f.targetCycle[scorer.id],
          targetName: st.players.find((p) => p.id === f.targetCycle[scorer.id])?.nickname,
          type: "pot",
          ball,
          points: value,
          breakValue: st.events.filter((e) => e.frameId === f.id && e.playerId === scorer.id && !e.undone).length + 1,
          frameId: f.id,
          turnIndex: st.shooterIndex,
        };

        f.scores[scorer.id] = (f.scores[scorer.id] ?? 0) + value;
        f.breaks[scorer.id] = Math.max(f.breaks[scorer.id] ?? 0, evt.breakValue ?? 0);
        f.eventIds.push(evt.id);

        // AUTO-END: potting the black ball while it was the only ball left
        // ends the frame immediately — the shooter who pots it opens next frame.
        const wasOnlyBlack = isOnlyBlackLeft(st.ballCounts); // check BEFORE decrement
        const newCounts = counts;
        if (ball === "black" && wasOnlyBlack) {
          // Compute frame money inline (same as endFrame)
          const allFrameEvents = [...st.events, evt].filter((e) => e.frameId === f.id && !e.undone);
          const money = computeFrameMoney({
            mode: f.mode,
            players: st.players,
            scores: f.scores,
            ballCounts: Object.fromEntries(
              st.players.map((p) => [p.id, pottedBallsPerPlayer(allFrameEvents, p.id)])
            ),
            targetCycle: f.targetCycle,
            moneyPer: st.moneyPer,
            moneyRate: st.moneyRate,
          });
          f.money = money.net;
          f.endedAt = Date.now();
          const best = Math.max(...st.players.map((p) => f.scores[p.id] ?? 0));
          const winners = st.players.filter((p) => (f.scores[p.id] ?? 0) === best && best >= 0);
          f.winnerId = winners.length ? winners[0].id : undefined;
          f.highestBreak = Math.max(0, ...st.players.map((p) => f.breaks[p.id] ?? 0));
          const running = mergeRunning(st.session.runningBalance, money.net);
          set({
            ballCounts: newCounts,
            frames: [...st.frames],
            events: [...st.events, evt],
            undoStack: st.undoStack,
            redoStack: st.redoStack,
            session: { ...st.session, runningBalance: running, nextFrameFirstShooter: st.shooterIndex },
          });
          return;
        }

        set({
          ballCounts: counts,
          frames: [...st.frames],
          events: [...st.events, evt],
          undoStack: st.undoStack,
          redoStack: st.redoStack,
        });
      },

      foul: () => {
        const st = get();
        const f = st.frames[st.frames.length - 1];
        if (!f || !st.session) return;
        const value = FOUL_VALUES[f.mode];
        const scorer = st.players[st.shooterIndex];
        if (!scorer) return;
        const evt: GameEvent = {
          id: nid(), ts: Date.now(), playerId: scorer.id, playerName: scorer.nickname,
          targetId: f.targetCycle[scorer.id],
          targetName: st.players.find((p) => p.id === f.targetCycle[scorer.id])?.nickname,
          type: "foul", points: value, frameId: f.id, turnIndex: st.shooterIndex,
        };
        f.scores[scorer.id] = (f.scores[scorer.id] ?? 0) + value;
        f.fouls[scorer.id] = (f.fouls[scorer.id] ?? 0) + 1;
        f.eventIds.push(evt.id);
        set({ frames: [...st.frames], events: [...st.events, evt] });
      },

      snookerMiss: () => {
        const st = get();
        const f = st.frames[st.frames.length - 1];
        if (!f || !st.session) return;
        const scorer = st.players[st.shooterIndex];
        if (!scorer) return;
        const value = SNOOKER_MISS_VALUES[f.mode];
        const evt: GameEvent = {
          id: nid(), ts: Date.now(), playerId: scorer.id, playerName: scorer.nickname,
          targetId: f.targetCycle[scorer.id],
          targetName: st.players.find((p) => p.id === f.targetCycle[scorer.id])?.nickname,
          type: "snooker_miss", points: value, frameId: f.id, turnIndex: st.shooterIndex,
        };
        f.scores[scorer.id] = (f.scores[scorer.id] ?? 0) + value;
        f.snookerMisses[scorer.id] = (f.snookerMisses[scorer.id] ?? 0) + 1;
        f.eventIds.push(evt.id);
        set({ frames: [...st.frames], events: [...st.events, evt] });
      },

      snookerHit: () => {
        const st = get();
        const f = st.frames[st.frames.length - 1];
        if (!f || !st.session) return;
        const scorer = st.players[st.shooterIndex];
        if (!scorer) return;
        const evt: GameEvent = {
          id: nid(),
          ts: Date.now(),
          playerId: scorer.id,
          playerName: scorer.nickname,
          targetId: f.targetCycle[scorer.id],
          targetName: st.players.find((p) => p.id === f.targetCycle[scorer.id])?.nickname,
          type: "snooker_hit",
          points: 1,
          frameId: f.id,
          turnIndex: st.shooterIndex,
        };
        f.scores[scorer.id] = (f.scores[scorer.id] ?? 0) + 1;
        f.snookerHits[scorer.id] = (f.snookerHits[scorer.id] ?? 0) + 1;
        f.eventIds.push(evt.id);
        set({ frames: [...st.frames], events: [...st.events, evt] });
      },

      // One composite tap: scoring event + auto end-turn + advance in a SINGLE
      // snapshot, so one Undo reverts the whole "wrong press" (foul AND the
      // turn that passed) back to the instant before.
      applyScoring: (kind) => {
        const st = get();
        const f = st.frames[st.frames.length - 1];
        const n = st.players.length;
        if (!f || !st.session || !n) return;
        const scorer = st.players[st.shooterIndex];
        if (!scorer) return;
        pushUndo(st);

        let type: GameEvent["type"];
        let points: number;
        if (kind === "foul") {
          type = "foul";
          points = FOUL_VALUES[f.mode];
          f.fouls[scorer.id] = (f.fouls[scorer.id] ?? 0) + 1;
        } else if (kind === "miss") {
          type = "snooker_miss";
          points = SNOOKER_MISS_VALUES[f.mode];
          f.snookerMisses[scorer.id] = (f.snookerMisses[scorer.id] ?? 0) + 1;
        } else {
          type = "snooker_hit";
          points = 1;
          f.snookerHits[scorer.id] = (f.snookerHits[scorer.id] ?? 0) + 1;
        }
        f.scores[scorer.id] = (f.scores[scorer.id] ?? 0) + points;

        const evt: GameEvent = {
          id: nid(), ts: Date.now(), playerId: scorer.id, playerName: scorer.nickname,
          targetId: f.targetCycle[scorer.id],
          targetName: st.players.find((p) => p.id === f.targetCycle[scorer.id])?.nickname,
          type, points, frameId: f.id, turnIndex: st.shooterIndex,
        };
        f.eventIds.push(evt.id);

        // FOUL-ON-BLACK auto-end: if only black was left, foul ends the frame immediately.
        // The fouling player opens next frame (they were "on" the black).
        if (kind === "foul" && isOnlyBlackLeft(st.ballCounts)) {
          const allFrameEvents = [...st.events, evt].filter((e) => e.frameId === f.id && !e.undone);
          const money = computeFrameMoney({
            mode: f.mode,
            players: st.players,
            scores: f.scores,
            ballCounts: Object.fromEntries(
              st.players.map((p) => [p.id, pottedBallsPerPlayer(allFrameEvents, p.id)])
            ),
            targetCycle: f.targetCycle,
            moneyPer: st.moneyPer,
            moneyRate: st.moneyRate,
          });
          f.money = money.net;
          f.endedAt = Date.now();
          const best = Math.max(...st.players.map((p) => f.scores[p.id] ?? 0));
          const winners = st.players.filter((p) => (f.scores[p.id] ?? 0) === best && best >= 0);
          f.winnerId = winners.length ? winners[0].id : undefined;
          f.highestBreak = Math.max(0, ...st.players.map((p) => f.breaks[p.id] ?? 0));
          const running = mergeRunning(st.session.runningBalance, money.net);
          set({
            frames: [...st.frames],
            events: [...st.events, evt],
            undoStack: st.undoStack,
            redoStack: st.redoStack,
            session: { ...st.session, runningBalance: running, nextFrameFirstShooter: st.shooterIndex },
          });
          return;
        }

        const passEvt: GameEvent = {
          id: nid(), ts: Date.now(), playerId: scorer.id, playerName: scorer.nickname,
          targetId: f.targetCycle[scorer.id],
          targetName: st.players.find((p) => p.id === f.targetCycle[scorer.id])?.nickname,
          type: "end_turn", points: 0, frameId: f.id, turnIndex: st.shooterIndex,
        };
        f.eventIds.push(passEvt.id);

        const nextShooter = st.reverse ? (st.shooterIndex - 1 + n) % n : (st.shooterIndex + 1) % n;
        set({
          frames: [...st.frames],
          events: [...st.events, evt, passEvt],
          shooterIndex: nextShooter,
          undoStack: st.undoStack,
          redoStack: st.redoStack,
        });
      },

      endTurn: () => {
        const st = get();
        const n = st.players.length;
        const f = st.frames[st.frames.length - 1];
        if (!n || !f) return;
        pushUndo(st);
        const scorer = st.players[st.shooterIndex];
        // Record an end_turn event so the break engine knows this visit is over.
        // The next shooter starts a fresh visit, which means "pot red first"
        // (if any reds remain) rather than carrying on a stale colour shot.
        // NOTE: the event MUST be appended to the events array (not just
        // eventIds) or inferBreakPhase can never see the visit boundary and a
        // returning shooter would wrongly keep a colour continuation.
        let nextEvents = st.events;
        if (scorer) {
          const evt: GameEvent = {
            id: nid(), ts: Date.now(), playerId: scorer.id, playerName: scorer.nickname,
            targetId: f.targetCycle[scorer.id],
            targetName: st.players.find((p) => p.id === f.targetCycle[scorer.id])?.nickname,
            type: "end_turn", points: 0, frameId: f.id, turnIndex: st.shooterIndex,
          };
          f.eventIds.push(evt.id);
          nextEvents = [...st.events, evt];
        }
        const idx = st.reverse ? (st.shooterIndex - 1 + n) % n : (st.shooterIndex + 1) % n;
        set({
          frames: [...st.frames],
          events: nextEvents,
          shooterIndex: idx,
          undoStack: st.undoStack,
          redoStack: st.redoStack,
        });
      },

      setShooterManual: (idx) => {
        const st = get();
        pushUndo(st);
        set({ shooterIndex: idx, undoStack: st.undoStack, redoStack: st.redoStack });
      },
      toggleReverse: () => {
        const st = get();
        pushUndo(st);
        set({ reverse: !st.reverse, undoStack: st.undoStack, redoStack: st.redoStack });
      },
      skipPlayer: () => get().endTurn(),

      undo: () => {
        const st = get();
        if (!st.session || !st.undoStack.length) return;
        const prev = st.undoStack[st.undoStack.length - 1];
        const cur = cloneSnapshot(st);
        st.redoStack.push(cur);
        if (st.redoStack.length > MAX_HISTORY) st.redoStack.shift();
        st.undoStack.pop();
        set({
          ...prev,
          undoStack: st.undoStack,
          redoStack: st.redoStack,
        });
      },

      redo: () => {
        const st = get();
        if (!st.session || !st.redoStack.length) return;
        const next = st.redoStack[st.redoStack.length - 1];
        const cur = cloneSnapshot(st);
        st.undoStack.push(cur);
        if (st.undoStack.length > MAX_HISTORY) st.undoStack.shift();
        st.redoStack.pop();
        set({
          ...next,
          undoStack: st.undoStack,
          redoStack: st.redoStack,
        });
      },

      endFrame: () => {
        const st = get();
        const f = st.frames[st.frames.length - 1];
        if (!f || !st.session) return;
        f.endedAt = Date.now();

        // Per-frame money: count balls potted in THIS frame only.
        const frameEvents = st.events.filter((e) => e.frameId === f.id && !e.undone);
        const money: MoneyResult = computeFrameMoney({
          mode: f.mode,
          players: st.players,
          scores: f.scores,
          // per-ball money: pass each player's OWN potted-ball counts from events
          ballCounts: Object.fromEntries(
            st.players.map((p) => [p.id, pottedBallsPerPlayer(frameEvents, p.id)])
          ),
          targetCycle: f.targetCycle,
          moneyPer: st.moneyPer,
          moneyRate: st.moneyRate,
        });
        f.money = money.net;

        let best = -Infinity;
        for (const p of st.players) {
          const sc = f.scores[p.id] ?? 0;
          if (sc > best) best = sc;
        }
        // winner = player(s) tied at best AND > 0
        const winners = st.players.filter((p) => (f.scores[p.id] ?? 0) === best && best >= 0);
        f.winnerId = winners.length ? winners[0].id : undefined;
        f.highestBreak = Math.max(0, ...st.players.map((p) => f.breaks[p.id] ?? 0));

        const running = mergeRunning(st.session.runningBalance, money.net);
        set({
          session: { ...st.session, runningBalance: running },
          frames: [...st.frames],
        });
      },

      endFrameWithOpener: (openerIdx) => {
        const st = get();
        const f = st.frames[st.frames.length - 1];
        if (!f || !st.session || f.endedAt) return; // guard double-end
        const frameEvents = st.events.filter((e) => e.frameId === f.id && !e.undone);
        const money = computeFrameMoney({
          mode: f.mode,
          players: st.players,
          scores: f.scores,
          ballCounts: Object.fromEntries(
            st.players.map((p) => [p.id, pottedBallsPerPlayer(frameEvents, p.id)])
          ),
          targetCycle: f.targetCycle,
          moneyPer: st.moneyPer,
          moneyRate: st.moneyRate,
        });
        f.money = money.net;
        f.endedAt = Date.now();
        const best = Math.max(0, ...st.players.map((p) => f.scores[p.id] ?? 0));
        const winners = st.players.filter((p) => (f.scores[p.id] ?? 0) === best && best >= 0);
        f.winnerId = winners.length ? winners[0].id : undefined;
        f.highestBreak = Math.max(0, ...st.players.map((p) => f.breaks[p.id] ?? 0));
        const running = mergeRunning(st.session.runningBalance, money.net);
        set({
          session: { ...st.session, runningBalance: running, nextFrameFirstShooter: openerIdx },
          frames: [...st.frames],
        });
      },

      newFrame: () => {
        const st = get();
        if (!st.session) return;
        // Rotate player order: opener (nextFrameFirstShooter) becomes index 0,
        // remaining players are reversed (per confirmed game rule).
        const openerIdx = st.session.nextFrameFirstShooter ?? 0;
        const rotated = buildNextFrameOrder(st.players, openerIdx);
        const frame = makeFrame(rotated, st.mode);
        const session = {
          ...st.session,
          frameIds: [...st.session.frameIds, frame.id],
          activeFrameId: frame.id,
          nextFrameFirstShooter: undefined, // consumed
        };
        set({
          session,
          players: rotated,
          frames: [...st.frames, frame],
          ballCounts: initialCounts(st.session.redCount),
          startCounts: initialCounts(st.session.redCount),
          shooterIndex: 0,
          undoStack: [],
          redoStack: [],
        });
      },

      renamePlayer: (id, nickname) =>
        set((s) => ({ players: s.players.map((p) => (p.id === id ? { ...p, nickname } : p)) })),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      toggleHaptics: () => set((s) => ({ haptics: !s.haptics })),
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
      setActiveFrameId: () => {
        const st = get();
        if (st.session && st.frames.length) {
          set({ session: { ...st.session, activeFrameId: st.frames[st.frames.length - 1].id } });
        }
      },
      openSettings: () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),
      setArchivedTableFee: (gameId, fee) => {
        const st = get();
        const feeVal = Math.max(0, fee);
        const history = st.history.map((g) => {
          if (g.id !== gameId) return g;
          const share = g.players.length > 0 ? feeVal / g.players.length : 0;
          const balances = { ...g.rawBalances };
          for (const p of g.players) {
            balances[p.id] = Math.round(((balances[p.id] ?? 0) - share) * 100) / 100;
          }
          return { ...g, tableFee: feeVal, balances };
        });
        set({ history });
      },
    }),
    {
      name: "smoke-master-v1",
      partialize: (s) => ({
        session: s.session,
        players: s.players,
        mode: s.mode,
        moneyRate: s.moneyRate,
        moneyPer: s.moneyPer,
        ballCounts: s.ballCounts,
        shooterIndex: s.shooterIndex,
        reverse: s.reverse,
        sound: s.sound,
        haptics: s.haptics,
        theme: s.theme,
        locale: s.locale,
        frames: s.frames,
        events: s.events,
        startCounts: s.startCounts,
        history: s.history,
      }),
      version: 1,
    }
  )
);

/** selector: current active frame */
export function useActiveFrame() {
  return useGameStore((s) => s.frames[s.frames.length - 1] ?? null);
}
export function useIsLive() {
  return useGameStore((s) => !!s.session && s.session.status === "live");
}
const EMPTY_BAL = {} as Record<string, number>;
export function useRunningBalance() {
  return useGameStore((s) =>
    s.session?.runningBalance ? s.session.runningBalance : EMPTY_BAL
  );
}
/** selector: archived finished games (newest first) */
export function useHistory() {
  return useGameStore((s) => s.history);
}