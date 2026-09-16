"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Flag } from "lucide-react";
import { useGameStore, useActiveFrame, useRunningBalance } from "@/store/gameStore";
import { BallPad } from "@/components/game/BallPad";
import { PlayerCard } from "@/components/game/PlayerCard";
import { EventLog } from "@/components/game/EventLog";
import { TurnHeader, ClockStrip } from "@/components/game/TurnHeader";
import { MoneyStrip } from "@/components/game/MoneyStrip";
import { ViolationPanel } from "@/components/game/ViolationPanel";
import { TurnCluster } from "@/components/game/TurnCluster";
import { ClearRack } from "@/components/game/ClearRack";
import { Button, Badge, Stat } from "@/components/ui";
import {
  BALL_NAME,
  BALL_ORDER,
  ballValue,
  BreakPhase,
  currentBreakCount,
  inferBreakPhase,
  legalBalls,
} from "@/lib/rules";
import type { ArchivedGame, BallColor } from "@/types";

import { useElapsed, useElapsedSum } from "@/hooks/useElapsed";

export function LiveMatch({ onPause }: {
  onPause?: () => void;
  /** @deprecated accepted for signature parity; completion flows via onPause → FramePauseSummary */
  onFinish?: (a: ArchivedGame) => void;
}) {
  const store = useGameStore();
  const frame = useActiveFrame();
  const running = useRunningBalance();
  const frameStartedAt = frame?.startedAt;
  const sessionClock = useElapsedSum(store.frames);
  const frameClock = useElapsed(frameStartedAt);
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Desktop analytics rail renders inline on ≥lg regardless of the accordion.
  const [isDesktop, setIsDesktop] = useState(false);

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
    toggleReverse,
    skipPlayer,
    reverse,
  } = store;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

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

  // Break engine: legal phase + consecutive break count for the current shooter
  const phase = inferBreakPhase(events, shooter?.id ?? "");
  const breakCount = currentBreakCount(events, shooter?.id ?? "");
  const legal = legalBalls(phase, store.ballCounts);
  const canStartBreak = phase === BreakPhase.COLOUR;
  // Once reds are gone, legal[0] is the exact next colour in sequence.
  const clearingColours = store.ballCounts.red === 0;
  const nextColour = clearingColours ? legal[0] : undefined;
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
    // End THIS frame only; the match page then shows the frame summary with
    // the choice to continue (next frame) or end the whole session.
    store.endFrame();
    if (onPause) onPause();
    if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate?.([20, 40, 20]); } catch {}
    }
  }

  // Frame summary: total points, sets potted, per-colour potted
  const startC = store.startCounts;
  const potted: Record<BallColor, number> = { red: 0, yellow: 0, green: 0, brown: 0, blue: 0, pink: 0, black: 0 };
  BALL_ORDER.forEach((c) => {
    potted[c] = (startC?.[c] ?? ballCounts[c]) - ballCounts[c];
  });
  const redsPot = potted.red;
  const coloursPot = BALL_ORDER
    .filter((c) => c !== "red")
    .reduce((s, c) => s + potted[c], 0);
  const setsPot = Math.min(redsPot, coloursPot);
  const totalPoints = players.reduce((s, p) => s + (frame.scores[p.id] ?? 0), 0);

  // clear-the-table "done" set (colours already potted, in official order)
  const clearDone: Record<BallColor, boolean> = {
    red: false, yellow: false, green: false, brown: false, blue: false, pink: false, black: false,
  };
  BALL_ORDER.forEach((c) => {
    clearDone[c] = (startC?.[c] ?? ballCounts[c]) - ballCounts[c] > 0;
  });

  return (
    <LiveShell>
      {/* Turn identity + money + break — one compact header row */}
      <TurnHeader
        shooter={shooter}
        targetName={targetName}
        breakCount={breakCount}
        runningMoney={running[shooter?.id] ?? 0}
        isClearing={clearingColours}
        clearingLabel={nextColour ? BALL_NAME[nextColour] : undefined}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ══════════ ZONE A — ACTION (input, always in thumb reach) ══════════ */}
        <div className="flex flex-col gap-3">
          {/* quick money peek — always visible on mobile */}
          <div className="lg:hidden">
            <MoneyStrip players={players} balances={running} activeId={shooter?.id} />
          </div>

          <ClockStrip frameNumber={store.frames.length} frameClock={frameClock} sessionClock={sessionClock} />

          {/* ACTION PAD — one input control at a time: the felt ball pad normally,
              or the non-blocking ClearRack the instant reds run out. */}
          {clearingColours ? (
            <ClearRack done={clearDone} nextColour={nextColour} ballValues={ballValues} onPot={onPot} />
          ) : (
            <div className="glass-strong glow-emerald p-3 md:p-4">
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
                clearingColours={clearingColours}
              />
            </div>
          )}

          {/* Turn cluster — consistent equal-height controls */}
          <TurnCluster
            onEndTurn={() => { tap(); endTurn(); }}
            onPrev={() => setShooterManual((shooterIndex - 1 + players.length) % players.length)}
            onReverse={() => { tap(); toggleReverse(); }}
            onSkip={() => { tap(); skipPlayer(); }}
            reverse={reverse}
          />

          {/* Segmented violations — Foul vs Snooker-miss visually distinct */}
          <ViolationPanel
            mode={mode}
            onFoul={() => { tap(); foul(); }}
            onMiss={() => { tap(); snookerMiss(); }}
            onSolve={() => { tap(); snookerHit(); }}
            onUndo={() => { tap(); undo(); }}
            canUndo={canUndo}
          />

          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Foul = ordinary foul · Miss = tried but didn't (−2) · Solve = hit it (+1)</span>
            <Button variant="ghost" size="sm" onClick={handleEndFrame} className="text-destructive">
              <Flag size={14} /> End frame
            </Button>
          </div>
        </div>

        {/* ══════════ ZONE B — ANALYTICS (visible on lg; accordion on mobile) ══════════ */}
        <aside className="flex flex-col gap-4">
          <div className="hidden lg:block">
            <MoneyStrip variant="rail" players={players} balances={running} activeId={shooter?.id} />
          </div>

          {/* quick frame summary chips */}
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Total pts" value={totalPoints} variant="accent" />
            <Stat label="Sets" value={setsPot} suffix="" />
            <Stat label="Reds" value={redsPot} />
          </div>

          {/* Scoreboard */}
          <div className="glass p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Scoreboard</h3>
              <Badge variant="gold">{mode === "points" ? "per point" : "per ball"}</Badge>
            </div>
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
          <div className="glass p-3">
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

          {/* Live events */}
          <div className="glass p-3">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Events</h3>
            <EventLog events={events} max={30} />
          </div>
        </aside>
      </div>

      {/* Mobile-only more-details drawer */}
      <button
        type="button"
        onClick={() => setDetailsOpen((v) => !v)}
        className="glass flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left lg:hidden"
        aria-expanded={detailsOpen}
      >
        <span className="text-sm font-semibold text-foreground/80">More details</span>
        <motion.span animate={{ rotate: detailsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-foreground/60" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {detailsOpen && !isDesktop ? (
          <motion.div
            key="details"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 pt-2 pb-1">
              {/* Money tonight (mobile) */}
              <div className="glass p-3">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Money tonight</h3>
                <div className="flex flex-wrap gap-4">
                  {players.map((p) => (
                    <Stat key={p.id} label={p.nickname} value={running[p.id] ?? 0} variant="money" />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </LiveShell>
  );
}

/** Simple content shell so both live and empty states share layout */
function LiveShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-6xl flex-col gap-4"
    >
      {children}
    </motion.div>
  );
}