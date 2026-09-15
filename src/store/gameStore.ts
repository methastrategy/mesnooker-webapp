"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BALL_START,
  ballValue,
  buildTargetCycle,
  FOUL_VALUES,
  pottedBallsPerPlayer,
} from "@/lib/rules";
import {
  computeFrameMoney,
  mergeRunning,
  type MoneyResult,
} from "@/lib/money";
import type {
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
  frames: FrameSnapshot[];
  events: GameEvent[];
  startCounts: BallCounts;
  history: ArchivedGame[];
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
  endTurn: () => void;
  undo: () => void;
  redo: () => void;
  setShooterManual: (idx: number) => void;
  toggleReverse: () => void;
  skipPlayer: () => void;
  endFrame: () => void;
  newFrame: () => void;
  renamePlayer: (id: string, nickname: string) => void;
  toggleSound: () => void;
  toggleHaptics: () => void;
  setActiveFrameId: () => void;
  /** apply (or clear) the table fee to an archived game's balances; fee split evenly */
  setArchivedTableFee: (gameId: string, fee: number) => void;
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
      frames: [],
      events: [],
      startCounts: initialCounts(),
      history: [],

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
        // Re-spotting: while reds remain on the table, potting a COLOUR puts it
        // back (count stays available for every red round). A RED pot is consumed.
        // Colours are only actually removed once reds run out.
        if (ball === "red") {
          if (counts.red > 0) counts.red -= 1;
        } else {
          if (counts.red === 0 && counts[ball] > 0) counts[ball] -= 1;
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

        set({
          ballCounts: counts,
          frames: [...st.frames],
          events: [...st.events, evt],
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
        const evt: GameEvent = {
          id: nid(), ts: Date.now(), playerId: scorer.id, playerName: scorer.nickname,
          targetId: f.targetCycle[scorer.id],
          targetName: st.players.find((p) => p.id === f.targetCycle[scorer.id])?.nickname,
          type: "snooker_miss", points: -2, frameId: f.id, turnIndex: st.shooterIndex,
        };
        f.scores[scorer.id] = (f.scores[scorer.id] ?? 0) - 2;
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

      endTurn: () => {
        const st = get();
        const n = st.players.length;
        if (!n) return;
        const idx = st.reverse ? (st.shooterIndex - 1 + n) % n : (st.shooterIndex + 1) % n;
        set({ shooterIndex: idx });
      },

      setShooterManual: (idx) => set({ shooterIndex: idx }),
      toggleReverse: () => set((s) => ({ reverse: !s.reverse })),
      skipPlayer: () => get().endTurn(),

      undo: () => {
        const st = get();
        if (!st.events.length || !st.frames.length) return;
        const evt = st.events[st.events.length - 1];
        const f = st.frames.find((x) => x.id === evt.frameId);
        if (!f) return;

        if (evt.type === "pot") {
          const pe = evt as PottedEvent;
          f.scores[evt.playerId] = Math.max(-999, (f.scores[evt.playerId] ?? 0) - pe.points);
          const counts = { ...st.ballCounts };
          // mirror pot's re-spot logic: a red pot is restored; a colour pot is
          // only restored if it was actually removed (i.e. reds were already 0)
          if (pe.ball === "red") {
            counts.red = Math.min(st.startCounts.red ?? BALL_START.red, counts.red + 1);
          } else if (st.ballCounts.red === 0) {
            counts[pe.ball] = Math.min((st.startCounts[pe.ball] ?? BALL_START[pe.ball]), counts[pe.ball] + 1);
          }
          f.eventIds = f.eventIds.filter((id) => id !== evt.id);
          set({ ballCounts: counts, frames: [...st.frames], events: st.events.slice(0, -1) });
        } else if (evt.type === "foul") {
          f.scores[evt.playerId] = Math.max(-999, (f.scores[evt.playerId] ?? 0) - evt.points);
          f.fouls[evt.playerId] = Math.max(0, (f.fouls[evt.playerId] ?? 0) - 1);
          f.eventIds = f.eventIds.filter((id) => id !== evt.id);
          set({ frames: [...st.frames], events: st.events.slice(0, -1) });
        } else if (evt.type === "snooker_miss") {
          f.scores[evt.playerId] = (f.scores[evt.playerId] ?? 0) + 2;
          f.snookerMisses[evt.playerId] = Math.max(0, (f.snookerMisses[evt.playerId] ?? 0) - 1);
          f.eventIds = f.eventIds.filter((id) => id !== evt.id);
          set({ frames: [...st.frames], events: st.events.slice(0, -1) });
        } else if (evt.type === "snooker_hit") {
          f.scores[evt.playerId] = Math.max(-999, (f.scores[evt.playerId] ?? 0) - 1);
          f.snookerHits[evt.playerId] = Math.max(0, (f.snookerHits[evt.playerId] ?? 0) - 1);
          f.eventIds = f.eventIds.filter((id) => id !== evt.id);
          set({ frames: [...st.frames], events: st.events.slice(0, -1) });
        } else {
          set({ events: st.events.slice(0, -1) });
        }
      },

      redo: () => {
        const st = get();
        // Single-direction undo; redo applied as: refresh current frame (no-op for persist model).
        set({ frames: [...st.frames] });
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

      newFrame: () => {
        const st = get();
        if (!st.session) return;
        const frame = makeFrame(st.players, st.mode);
        const session = {
          ...st.session,
          frameIds: [...st.session.frameIds, frame.id],
          activeFrameId: frame.id,
        };
        set({
          session,
          frames: [...st.frames, frame],
          ballCounts: initialCounts(st.session.redCount),
          startCounts: initialCounts(st.session.redCount),
          shooterIndex: 0,
        });
      },

      renamePlayer: (id, nickname) =>
        set((s) => ({ players: s.players.map((p) => (p.id === id ? { ...p, nickname } : p)) })),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      toggleHaptics: () => set((s) => ({ haptics: !s.haptics })),
      setActiveFrameId: () => {
        const st = get();
        if (st.session && st.frames.length) {
          set({ session: { ...st.session, activeFrameId: st.frames[st.frames.length - 1].id } });
        }
      },
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