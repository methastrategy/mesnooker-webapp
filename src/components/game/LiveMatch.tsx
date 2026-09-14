"use client";

import * as React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { History as HistoryIcon, Flag } from "lucide-react";
import { useGameStore, useActiveFrame, useRunningBalance } from "@/store/gameStore";
import { BallPad } from "@/components/game/BallPad";
import { PlayerCard } from "@/components/game/PlayerCard";
import { TurnControls } from "@/components/game/TurnControls";
import { EventLog } from "@/components/game/EventLog";
import { Sheet, Button, Badge, Stat, AnimatedNumber, Confetti } from "@/components/ui";
import {
  BALL_HEX,
  ballValue,
  BreakPhase,
  currentBreakCount,
  inferBreakPhase,
  legalBalls,
} from "@/lib/rules";
import type { BallColor } from "@/types";

export function LiveMatch() {
  const store = useGameStore();
  const frame = useActiveFrame();
  const running = useRunningBalance();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    players,
    mode,
    ballCounts,
    shooterIndex,
    reverse,
    sound,
    haptics,
    pot,
    foul,
    snookerMiss,
    snookerHit,
    endTurn,
    undo,
    setShooterManual,
    toggleReverse,
    endFrame,
    newFrame,
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
    endFrame();
    setDialogOpen(true);
    if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate?.([20, 40, 20]); } catch {}
    }
  }

  return (
    <LiveShell>
      {/* Top: shooter + break + round info */}
      <div className="flex flex-col gap-3">
        <div className="glass glow-emerald flex items-center gap-4 p-4">
          <div className="flex items-center gap-3 flex-1">
            <span
              className="h-10 w-10 rounded-full snooker-ball"
              style={{ background: BALL_HEX[shooter.color as BallColor] }}
            />
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Shooting</div>
              <div className="text-xl font-bold">{shooter.nickname}</div>
              <div className="text-xs text-muted-foreground">target: {targetName}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Break</div>
            <div className="text-2xl font-bold tabular-nums text-gold">
              <AnimatedNumber value={breakCount} />
            </div>
          </div>
        </div>

        {/* Scoreboard */}
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

      {/* Ball pad */}
      <div className="glass p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Balls on table
          </h3>
          <Badge variant="neutral">
            <span className="text-primary">{ballCounts.red}</span>/{store.session?.redCount ?? 15} reds
          </Badge>
        </div>
        <div className="mb-3 text-[12px] text-muted-foreground">
          {canStartBreak
            ? "Pot a colour to continue the break"
            : "First shot of a break must be Red"}
        </div>
        <BallPad
          legal={legal}
          ballValues={ballValues}
          onPot={onPot}
          showCount={(c) => store.ballCounts[c]}
        />
      </div>

      {/* Play / foul actions */}
      <div className="glass p-4">
        <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Actions
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button variant="danger" onClick={() => { tap(); foul(); }}>
            Foul ({mode === "points" ? "-4" : "-2"})
          </Button>
          <Button variant="danger" onClick={() => { tap(); snookerMiss(); }}>Miss −2</Button>
          <Button variant="gold" onClick={() => { tap(); snookerHit(); }}>Hit +1</Button>
          <Button variant="outline" onClick={() => { tap(); undo(); }} disabled={!canUndo}>Undo</Button>
        </div>
      </div>

      {/* Turn controls */}
      <div className="glass p-4">
        <TurnControls
          onEndTurn={() => { tap(); endTurn(); }}
          onPrev={() => setShooterManual((shooterIndex - 1 + players.length) % players.length)}
          onReverse={toggleReverse}
          onSkip={endTurn}
          onUndo={undo}
          reverse={reverse}
          canUndo={canUndo}
        />
      </div>

      {/* Frame controls + history */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleEndFrame}>
          <Flag size={16} /> End frame
        </Button>
        <Button variant="glass" onClick={() => setHistoryOpen(true)}>
          <HistoryIcon size={16} /> History
        </Button>
      </div>
      <FrameEndDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onNext={() => { newFrame(); setDialogOpen(false); }}
        frameNumber={store.frames.length}
      />

      <div className="glass p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Money tonight
          </h3>
          <Badge variant="gold">{mode === "points" ? "per point" : "per ball"}</Badge>
        </div>
        <div className="flex flex-wrap gap-4">
          {players.map((p) => (
            <Stat
              key={p.id}
              label={p.nickname}
              value={running[p.id] ?? 0}
              variant="money"
            />
          ))}
        </div>
      </div>

      {/* Live events */}
      <div className="glass p-4">
        <EventLog events={frameEventsText} max={30} />
      </div>

      <Sheet open={historyOpen} onClose={() => setHistoryOpen(false)} title="Frame history">
        <EventLog events={frameEventsText} max={200} />
      </Sheet>
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

/** End-of-frame celebration dialog with confetti + next frame */
function FrameEndDialog({
  open,
  onClose,
  onNext,
  frameNumber,
}: {
  open: boolean;
  onClose: () => void;
  onNext: () => void;
  frameNumber: number;
}) {
  if (!open) return null;
  return (
    <>
      <Confetti />
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="glass-strong flex w-full max-w-sm flex-col items-center gap-4 p-8 text-center"
        >
          <span className="text-4xl">🏆</span>
          <h2 className="text-2xl font-bold">Frame {frameNumber}</h2>
          <p className="text-muted-foreground">Frame complete — money settled.</p>
          <Button size="lg" className="w-full" onClick={onNext}>
            Start next frame →
          </Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </motion.div>
      </motion.div>
    </>
  );
}