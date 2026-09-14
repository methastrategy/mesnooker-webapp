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
}

interface GameStore extends PersistShape {
  startSession: (o: { players: Player[]; mode: GameMode; moneyRate: number; moneyPer: MoneyRateUnit; redCount: number }) => void;
  endSession: () => SessionSummary | null;
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

      startSession: ({ players, mode, moneyRate, moneyPer, redCount = 15 }) => {
        if (players.length < 2) return;
        const id = nid();
        const frame = makeFrame(players, mode);
        const session: SessionSummary = {
          id,
          createdAt: Date.now(),
          mode,
          moneyRate,
          moneyPer,
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
        if (counts[ball] > 0) counts[ball] -= 1;

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
          counts[pe.ball] = Math.min((st.startCounts[pe.ball] ?? BALL_START[pe.ball]), counts[pe.ball] + 1);
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

        const money: MoneyResult = computeFrameMoney({
          mode: f.mode,
          players: st.players,
          scores: f.scores,
          // per-ball money: pass each player's OWN potted-ball counts from events
          ballCounts: Object.fromEntries(
            st.players.map((p) => [p.id, pottedBallsPerPlayer(st.events, p.id)])
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