"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useGameStore, useActiveFrame, useRunningBalance } from "@/store/gameStore";
import { BallPad } from "@/components/game/BallPad";
import { TurnHeader } from "@/components/game/TurnHeader";
import { MoneyStrip } from "@/components/game/MoneyStrip";
import { ClearRack } from "@/components/game/ClearRack";
import { ControlDock } from "@/components/game/ControlDock";
import { FrameDetailsPanel } from "@/components/game/FrameDetailsPanel";
import { ActionToast } from "@/components/game/ActionToast";
import {
  BALL_NAME,
  BALL_ORDER,
  ballValue,
  BreakPhase,
  currentBreakCount,
  inferBreakPhase,
  legalBalls,
} from "@/lib/rules";
import type { ArchivedGame, BallColor, Player } from "@/types";

import { useElapsed, useElapsedSum } from "@/hooks/useElapsed";
import { playPotSound, playPenaltySound } from "@/lib/sound";

type ToastTone = "info" | "success" | "danger";

export function LiveMatch({ onPause }: {
  onPause?: () => void;
  /** @deprecated accepted for signature parity; completion flows via onPause → FramePauseSummary */
  onFinish?: (a: ArchivedGame) => void;
}) {
  const frame = useActiveFrame();
  const running = useRunningBalance();
  const session = useGameStore((s) => s.session);
  const frames = useGameStore((s) => s.frames);
  const allEvents = useGameStore((s) => s.events);
  const players = useGameStore((s) => s.players);
  const mode = useGameStore((s) => s.mode);
  const ballCounts = useGameStore((s) => s.ballCounts);
  const shooterIndex = useGameStore((s) => s.shooterIndex);
  const sound = useGameStore((s) => s.sound);
  const haptics = useGameStore((s) => s.haptics);
  const customRules = useGameStore((s) => s.customRules);
  const startCounts = useGameStore((s) => s.startCounts);
  const canUndo = useGameStore((s) => s.undoStack.length > 0);
  const canRedo = useGameStore((s) => s.redoStack.length > 0);

  const pot = useGameStore((s) => s.pot);
  const applyScoring = useGameStore((s) => s.applyScoring);
  const endTurn = useGameStore((s) => s.endTurn);
  const endFrame = useGameStore((s) => s.endFrame);
  const undo = useGameStore((s) => s.undo);
  const redo = useGameStore((s) => s.redo);

  const frameStartedAt = frame?.startedAt;
  const sessionClock = useElapsedSum(frames);
  const frameClock = useElapsed(frameStartedAt);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  // Transient toast — flashes the consequence of a scoring tap.
  const [toast, setToast] = useState<{ id: number; msg: string; tone: ToastTone } | null>(null);
  // Desktop analytics rail renders inline on ≥lg regardless of the accordion.
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // MediaQueryList: modern browsers expose `window.matchMedia` (MediaQueryList
    // with .matches/.addEventListener). Older engines fall back to a simple
    // window-width check so the desktop analytics rail never misfires.
    const w = window as unknown as {
      matchMedia?: (q: string) => { matches: boolean; addEventListener?: (t: string, cb: () => void) => void };
    };
    let mq: { matches: boolean; addEventListener?: (t: string, cb: () => void) => void } | null = null;
    try {
      mq = typeof w.matchMedia === "function" ? w.matchMedia("(min-width: 1024px)") : null;
    } catch {
      mq = null;
    }
    const update = () => setIsDesktop(mq ? mq.matches : window.innerWidth >= 1024);
    update();
    if (mq && typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => mq?.addEventListener?.("change", update);
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!frame || !session) {
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

  const events = allEvents.filter((e) => e.frameId === frame.id && !e.undone);

  // Break engine: legal phase + consecutive break count for the current shooter
  const phase = inferBreakPhase(events, shooter?.id ?? "");
  const breakCount = currentBreakCount(events, shooter?.id ?? "");
  const legal = legalBalls(phase, ballCounts);
  const canStartBreak = phase === BreakPhase.COLOUR;
  // Once reds are gone, legal[0] is the exact next colour in sequence.
  const clearingColours = ballCounts.red === 0;
  // Ordered "ClearRack" only engages once the free finishing colour has been
  // potted (phase back to RED_FIRST). Right after the last red the shooter is
  // still entitled to any colour — show the free ball pad.
  const clearOrderLocked = clearingColours && phase === BreakPhase.RED_FIRST;
  const nextColour = clearOrderLocked ? legal[0] : undefined;
  const ballValues: Record<BallColor, number> = {
    red: ballValue("red", mode, customRules),
    yellow: ballValue("yellow", mode, customRules),
    green: ballValue("green", mode, customRules),
    brown: ballValue("brown", mode, customRules),
    blue: ballValue("blue", mode, customRules),
    pink: ballValue("pink", mode, customRules),
    black: ballValue("black", mode, customRules),
  };

  function handleHaptics() {
    if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.([6]);
      } catch {}
    }
  }
  function playSound(type: "pot" | "penalty" = "pot") {
    if (!sound) return;
    if (type === "pot") {
      playPotSound();
    } else {
      playPenaltySound();
    }
  }
  const tap = (type: "pot" | "penalty" = "pot") => {
    handleHaptics();
    playSound(type);
  };

  function onPot(ball: BallColor) {
    tap();
    pot(ball);
    // AUTO-END detection: if potting the black ended the frame, go to pause screen.
    const freshFrames = useGameStore.getState().frames;
    const freshFrame = freshFrames[freshFrames.length - 1];
    if (freshFrame?.endedAt && onPause) {
      if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate?.([20, 60, 20]); } catch {}
      }
      setToast({ id: Date.now(), msg: `⬛ Black potted — frame over!`, tone: "success" });
      // Short delay so the toast is seen before transitioning
      setTimeout(() => onPause(), 600);
      return;
    }
    setToast({ id: Date.now(), msg: `${BALL_NAME[ball]} potted`, tone: "info" });
  }

  /** Next shooter the store will rotate to. */
  function nextShooter(): Player | undefined {
    const n = players.length;
    const idx = (shooterIndex + 1) % n;
    return players[idx];
  }

  /** Record a penalty/solve, then AUTO-advance to the next player in ONE store
   *  transaction (applyScoring), so a single Undo reverts the whole wrong press
   *  including the turn that passed. */
  function scoringAction(kind: "foul" | "miss" | "solve", verb: string, value: string, tone: ToastTone) {
    tap("penalty");
    applyScoring(kind);
    // FOUL-ON-BLACK auto-end: the store will have set frame.endedAt
    const freshFrames = useGameStore.getState().frames;
    const freshFrame = freshFrames[freshFrames.length - 1];
    if (freshFrame?.endedAt && onPause) {
      if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate?.([20, 60, 20]); } catch {}
      }
      setToast({ id: Date.now(), msg: `⬛ Foul on black — frame over!`, tone: "danger" });
      setTimeout(() => onPause(), 600);
      return;
    }
    const next = nextShooter();
    setToast({ id: Date.now(), msg: `${verb} ${value} · → ${next?.nickname ?? "next"}`, tone });
  }

  function handleEndFrame() {
    // End THIS frame only; the match page then shows the frame summary with
    // the choice to continue (next frame) or end the whole session.
    endFrame();
    if (onPause) onPause();
    if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate?.([20, 40, 20]); } catch {}
    }
  }

  // Frame summary: total points, sets potted, per-colour potted
  const startC = startCounts;
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
      {/* Top Match Scoreboard + Shooter & Queue Bar */}
      <TurnHeader
        shooter={shooter}
        targetName={targetName}
        breakCount={breakCount}
        runningMoney={running[shooter?.id] ?? 0}
        isClearing={clearOrderLocked}
        clearingLabel={nextColour ? BALL_NAME[nextColour] : undefined}
        players={players}
        shooterIndex={shooterIndex}
        scores={frame.scores}
        runningBalances={running}
        canStartBreak={canStartBreak}
        frameClock={frameClock}
        sessionClock={sessionClock}
        frameNumber={frames.length}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* ══════════ ZONE A — THE TABLE ARENA & COMMAND COCKPIT ══════════ */}
        <div className="flex flex-col gap-3.5">
          {/* THE TABLE / BALL RACK ARENA */}
          {clearOrderLocked ? (
            <ClearRack done={clearDone} nextColour={nextColour} ballValues={ballValues} onPot={onPot} />
          ) : (
            <BallPad
              legal={legal}
              ballValues={ballValues}
              onPot={onPot}
              showCount={(c) => ballCounts[c]}
              clearingColours={clearOrderLocked}
            />
          )}

          {/* Quick money peek — visible on mobile, directly above the deck */}
          <div className="lg:hidden">
            <MoneyStrip players={players} balances={running} activeId={shooter?.id} />
          </div>

          {/* The control deck — penalties, solve, red pot, End turn, ⋯ More, and End frame */}
          <ControlDock
            mode={mode}
            canPotRed={legal.includes("red")}
            onPotRed={() => onPot("red")}
            onFoul={() => scoringAction("foul", "Foul", mode === "points" ? "-4" : "-2", "danger")}
            onMiss={() => scoringAction("miss", "Snooker miss", mode === "points" ? "-2" : "-1", "danger")}
            onSolve={() => scoringAction("solve", "Solve", "+1", "success")}
            onEndTurn={() => { tap(); endTurn(); setToast({ id: Date.now(), msg: `→ ${nextShooter()?.nickname ?? "next"}`, tone: "info" }); }}
            moreOpen={moreOpen}
            onMoreOpen={() => setMoreOpen(true)}
            onMoreClose={() => setMoreOpen(false)}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={() => { setMoreOpen(false); tap(); undo(); }}
            onRedo={() => { setMoreOpen(false); tap(); redo(); }}
            onEndFrame={() => { setMoreOpen(false); handleEndFrame(); }}
          />

          <div className="text-center text-[11px] font-mono text-muted-foreground">
            Foul · Miss · Solve pass to the next player automatically.
          </div>
        </div>

        {/* ══════════ ZONE B — TELEMETRY & FRAME INTELLIGENCE ══════════ */}
        <aside className="hidden lg:flex flex-col gap-4">
          <FrameDetailsPanel
            players={players}
            scores={frame.scores}
            balances={running}
            activeId={shooter?.id}
            potted={potted}
            events={events}
            mode={mode}
            totalPoints={totalPoints}
            setsPot={setsPot}
            redsPot={redsPot}
          />
        </aside>
      </div>

      {/* Mobile-only Frame Intelligence accordion drawer */}
      <button
        type="button"
        onClick={() => setDetailsOpen((v) => !v)}
        className="glass flex w-full items-center justify-between rounded-full px-5 py-3 text-left lg:hidden cursor-pointer shadow-md"
        aria-expanded={detailsOpen}
      >
        <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-foreground/90">
          Match Telemetry & Scorecard
        </span>
        <motion.span animate={{ rotate: detailsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-foreground/70" />
        </motion.span>
      </button>

      {detailsOpen && !isDesktop ? (
        <div className="flex flex-col gap-3 pt-1 pb-2">
          <FrameDetailsPanel
            players={players}
            scores={frame.scores}
            balances={running}
            activeId={shooter?.id}
            potted={potted}
            events={events}
            mode={mode}
            totalPoints={totalPoints}
            setsPot={setsPot}
            redsPot={redsPot}
          />
        </div>
      ) : null}

      {/* Action consequence toast — flashes clearly on every scoring tap */}
      {toast ? (
        <ActionToast
          key={toast.id}
          message={toast.msg}
          tone={toast.tone}
          onDone={() => setToast(null)}
        />
      ) : null}

      {/* Bottom clearance on mobile so fixed dock never occludes content */}
      <div className="h-28 lg:hidden" aria-hidden />
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