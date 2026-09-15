"use client";

import * as React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Flag, ChevronDown, ArrowRight, ChevronLeft } from "lucide-react";
import { useGameStore, useActiveFrame, useRunningBalance } from "@/store/gameStore";
import { BallPad } from "@/components/game/BallPad";
import { PlayerCard } from "@/components/game/PlayerCard";
import { EventLog } from "@/components/game/EventLog";
import { Button, Badge, Stat, AnimatedNumber } from "@/components/ui";
import {
  BALL_HEX,
  BALL_NAME,
  BALL_ORDER,
  ballValue,
  BreakPhase,
  currentBreakCount,
  inferBreakPhase,
  legalBalls,
} from "@/lib/rules";
import type { ArchivedGame, BallColor } from "@/types";

export function LiveMatch({ onFinish }: { onFinish?: (a: ArchivedGame) => void }) {
  const store = useGameStore();
  const frame = useActiveFrame();
  const running = useRunningBalance();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const {
    players,
    mode,
    ballCounts,
    shooterIndex,
    sound,
    haptics,
    pot,
    foul,
    snookerMiss,
    snookerHit,
    endTurn,
    undo,
    setShooterManual,
  } = store;

  if (!frame || !store.session) {
    return (
      <LiveShell>
        <div className="glass p-8 text-center text-muted-foreground">
          No active session. Start one from the dashboard.
        </div>
      </LiveShell>
    );
  }

  const shooter = players[shooterIndex];
  const targetId = frame.targetCycle[shooter?.id];
  const targetName = players.find((p) => p.id === targetId)?.nickname;

  const events = store.events.filter((e) => e.frameId === frame.id && !e.undone);
  const frameEventsText = events;

  // Break engine: legal phase + consecutive break count for the current shooter
  const phase = inferBreakPhase(events, shooter?.id ?? "");
  const breakCount = currentBreakCount(events, shooter?.id ?? "");
  const legal = legalBalls(phase, store.ballCounts);
  const canStartBreak = phase === BreakPhase.COLOUR;
  const ballValues: Record<BallColor, number> = {
    red: ballValue("red", mode),
    yellow: ballValue("yellow", mode),
    green: ballValue("green", mode),
    brown: ballValue("brown", mode),
    blue: ballValue("blue", mode),
    pink: ballValue("pink", mode),
    black: ballValue("black", mode),
  };

  function handleHaptics() {
    if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.([6]);
      } catch {}
    }
  }
  function playSound() {
    if (!sound || typeof window === "undefined") return;
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 660;
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
      o.start();
      o.stop(ctx.currentTime + 0.1);
      if (ctx.state === "suspended") void ctx.resume();
    } catch {}
  }
  const tap = () => {
    handleHaptics();
    playSound();
  };

  function onPot(ball: BallColor) {
    tap();
    pot(ball);
  }

  const canUndo = store.events.length > 0;

  function handleEndFrame() {
    const archived = store.archiveAndReset();
    if (archived && onFinish) onFinish(archived);
    if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate?.([20, 40, 20]); } catch {}
    }
  }

  // Frame summary (shown in details): total points, sets potted, per-colour potted
  const startC = store.startCounts;
  const potted: Record<BallColor, number> = { red: 0, yellow: 0, green: 0, brown: 0, blue: 0, pink: 0, black: 0 };
  BALL_ORDER.forEach((c) => {
    potted[c] = (startC?.[c] ?? ballCounts[c]) - ballCounts[c];
  });
  const redsPot = potted.red;
  const coloursPot = BALL_ORDER
    .filter((c) => c !== "red")
    .reduce((s, c) => s + potted[c], 0);
  // 1 set = 1 red + 1 colour
  const setsPot = Math.min(redsPot, coloursPot);
  const totalPoints = players.reduce((s, p) => s + (frame.scores[p.id] ?? 0), 0);

  return (
    <LiveShell>
      {/* Shooter header (compact — the star is the action pad) */}
      <div className="glass glow-emerald flex items-center gap-3 p-3">
        <span
          className="h-9 w-9 rounded-full snooker-ball"
          style={{ background: BALL_HEX[shooter.color as BallColor] }}
        />
        <div className="min-w-0 flex-1">
          <div className="font-bold truncate">{shooter.nickname}</div>
          <div className="text-[11px] text-muted-foreground">target: {targetName}</div>
        </div>
        <div className="text-right leading-tight">
          <div className="text-[10px] uppercase text-muted-foreground">Break</div>
          <div className="text-xl font-bold tabular-nums text-gold">
            <AnimatedNumber value={breakCount} />
          </div>
        </div>
      </div>

      {/* ⭐ ACTION PAD — the primary control, big & few */}
      <div className="glass-strong glow-emerald p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">
            Tap to play
          </h3>
          <Badge variant={canStartBreak ? "default" : "danger"}>
            {canStartBreak ? "pick a colour" : "red first"}
          </Badge>
        </div>
        <BallPad
          legal={legal}
          ballValues={ballValues}
          onPot={onPot}
          showCount={(c) => store.ballCounts[c]}
        />
      </div>

      {/* Essential actions — big, thumb-friendly */}
      <div className="glass p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button variant="danger" size="lg" onClick={() => { tap(); foul(); }}>
            Foul {mode === "points" ? "-4" : "-2"}
          </Button>
          <Button variant="danger" size="sm" onClick={() => { tap(); snookerMiss(); }}>Miss −2</Button>
          <Button variant="gold" size="sm" onClick={() => { tap(); snookerHit(); }}>Hit +1</Button>
          <Button variant="outline" size="sm" onClick={() => { tap(); undo(); }} disabled={!canUndo}>Undo</Button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Button variant="default" size="lg" onClick={() => { tap(); endTurn(); }}>
            <ArrowRight size={18} /> End turn
          </Button>
          <Button variant="outline" size="lg" onClick={() => setShooterManual((shooterIndex - 1 + players.length) % players.length)}>
            <ChevronLeft size={16} /> Prev
          </Button>
          <Button variant="danger" size="lg" onClick={handleEndFrame}>
            <Flag size={16} /> End game
          </Button>
        </div>
      </div>

      {/* Details (collapsible) — scoreboard, potted, sets, money, history */}
      <button
        type="button"
        onClick={() => setDetailsOpen((v) => !v)}
        className="glass flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left"
        aria-expanded={detailsOpen}
      >
        <span className="text-sm font-semibold text-foreground/80">Frame details</span>
        <motion.span
          animate={{ rotate: detailsOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} className="text-foreground/60" />
        </motion.span>
      </button>
      {(detailsOpen) ? (
        <div className="flex flex-col gap-4">
          {/* quick frame summary chips */}
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Total pts" value={totalPoints} variant="accent" />
            <Stat label="Sets (1=red+colour)" value={setsPot} suffix="" />
            <Stat label="Reds potted" value={redsPot} />
          </div>

          {/* Scoreboard */}
          <div className="glass">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Scoreboard</h3>
            <div className="flex flex-col gap-2">
              {players.map((p, i) => (
                <PlayerCard
                  key={p.id}
                  player={p}
                  points={frame.scores[p.id] ?? 0}
                  money={running[p.id] ?? 0}
                  isShooter={i === shooterIndex}
                  targetName={players.find((x) => x.id === frame.targetCycle[p.id])?.nickname}
                  breakValue={breakCount}
                  isHolder={p.id === shooter?.id}
                />
              ))}
            </div>
          </div>

          {/* potted detail per colour */}
          <div className="glass">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Potted this frame
            </h3>
            <div className="flex flex-wrap gap-2">
              {BALL_ORDER
                .filter((c) => potted[c] > 0)
                .map((c) => (
                  <Badge key={c} variant="neutral">
                    {BALL_NAME[c]}: {potted[c]}
                  </Badge>
                ))}
              {!BALL_ORDER.some((c) => potted[c] > 0) ? (
                <span className="text-xs text-muted-foreground">Nothing potted yet</span>
              ) : null}
            </div>
          </div>

          {/* Money tonight */}
          <div className="glass">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Money tonight</h3>
              <Badge variant="gold">{mode === "points" ? "per point" : "per ball"}</Badge>
            </div>
            <div className="flex flex-wrap gap-4">
              {players.map((p) => (
                <Stat key={p.id} label={p.nickname} value={running[p.id] ?? 0} variant="money" />
              ))}
            </div>
          </div>

          {/* Live events */}
          <div className="glass">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Events</h3>
            <EventLog events={frameEventsText} max={30} />
          </div>
        </div>
      ) : null}

          </LiveShell>
        );
      }

/** Simple content shell so both live and empty states share layout */
function LiveShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-3xl flex-col gap-4"
    >
      {children}
    </motion.div>
  );
}