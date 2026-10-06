"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useGameStore, useActiveFrame, useRunningBalance } from "@/store/gameStore";
import { BallPad } from "@/components/game/BallPad";
import { TurnHeader } from "@/components/game/TurnHeader";
import { ClearRack } from "@/components/game/ClearRack";
import { ControlDock } from "@/components/game/ControlDock";
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
  const [moreOpen, setMoreOpen] = useState(false);
  const [toast, setToast] = useState<{ id: number; msg: string; tone: ToastTone } | null>(null);

  const shooter = players[shooterIndex];
  const targetId = frame?.targetCycle?.[shooter?.id];
  const targetName = players.find((p) => p.id === targetId)?.nickname;

  const events = allEvents.filter((e) => e.frameId === frame?.id && !e.undone);

  // Break engine: legal phase + consecutive break count for the current shooter
  const phase = inferBreakPhase(events, shooter?.id ?? "");
  const breakCount = currentBreakCount(events, shooter?.id ?? "");
  const legal = legalBalls(phase, ballCounts);
  const canStartBreak = phase === BreakPhase.COLOUR;
  const clearingColours = ballCounts.red === 0;
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

  const handleHaptics = useCallback(() => {
    if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.([6]);
      } catch {}
    }
  }, [haptics]);

  const playSound = useCallback((type: "pot" | "penalty" = "pot") => {
    if (!sound) return;
    if (type === "pot") {
      playPotSound();
    } else {
      playPenaltySound();
    }
  }, [sound]);

  const tap = useCallback((type: "pot" | "penalty" = "pot") => {
    handleHaptics();
    playSound(type);
  }, [handleHaptics, playSound]);

  const nextShooter = useCallback((): Player | undefined => {
    if (players.length === 0) return undefined;
    const n = players.length;
    const idx = (shooterIndex + 1) % n;
    return players[idx];
  }, [players, shooterIndex]);

  const onPot = useCallback((ball: BallColor) => {
    tap();
    pot(ball);
    const freshFrames = useGameStore.getState().frames;
    const freshFrame = freshFrames[freshFrames.length - 1];
    if (freshFrame?.endedAt && onPause) {
      if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate?.([20, 60, 20]); } catch {}
      }
      setToast({ id: Date.now(), msg: "⬛ Black potted — frame over!", tone: "success" });
      setTimeout(() => onPause(), 600);
      return;
    }
    setToast({ id: Date.now(), msg: `${BALL_NAME[ball]} potted`, tone: "info" });
  }, [tap, pot, onPause, haptics]);

  const scoringAction = useCallback((kind: "foul" | "miss" | "solve", verb: string, value: string, tone: ToastTone) => {
    tap("penalty");
    applyScoring(kind);
    const freshFrames = useGameStore.getState().frames;
    const freshFrame = freshFrames[freshFrames.length - 1];
    if (freshFrame?.endedAt && onPause) {
      if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate?.([20, 60, 20]); } catch {}
      }
      setToast({ id: Date.now(), msg: "⬛ Foul on black — frame over!", tone: "danger" });
      setTimeout(() => onPause(), 600);
      return;
    }
    const next = nextShooter();
    setToast({ id: Date.now(), msg: `${verb} ${value} · → ${next?.nickname ?? "next"}`, tone });
  }, [tap, applyScoring, onPause, haptics, nextShooter]);

  const handleEndFrame = useCallback(() => {
    endFrame();
    if (onPause) onPause();
    if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate?.([20, 40, 20]); } catch {}
    }
  }, [endFrame, onPause, haptics]);

  // Keyboard shortcuts for effortless PC match play
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        tap();
        endTurn();
        setToast({ id: Date.now(), msg: `→ ${nextShooter()?.nickname ?? "next"}`, tone: "info" });
      } else if (e.key === "u" || e.key === "U" || ((e.ctrlKey || e.metaKey) && e.key === "z")) {
        if (canUndo) {
          e.preventDefault();
          tap();
          undo();
          setToast({ id: Date.now(), msg: "↺ Undone", tone: "info" });
        }
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        scoringAction("foul", "Foul", mode === "points" ? "-4" : "-2", "danger");
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        scoringAction("miss", "Snooker miss", mode === "points" ? "-2" : "-1", "danger");
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        scoringAction("solve", "Solve", "+1", "success");
      } else if (e.key === "r" || e.key === "R") {
        if (legal.includes("red")) {
          e.preventDefault();
          onPot("red");
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, endTurn, undo, mode, legal, nextShooter, onPot, scoringAction, tap]);

  if (!frame || !session) {
    return (
      <div className="mx-auto flex w-full max-w-5xl h-full items-center justify-center">
        <div className="glass p-8 text-center text-muted-foreground rounded-2xl">
          No active session. Start one from the dashboard.
        </div>
      </div>
    );
  }

  // clear-the-table "done" set (colours already potted, in official order)
  const startC = startCounts;
  const clearDone: Record<BallColor, boolean> = {
    red: false, yellow: false, green: false, brown: false, blue: false, pink: false, black: false,
  };
  BALL_ORDER.forEach((c) => {
    clearDone[c] = (startC?.[c] ?? ballCounts[c]) - ballCounts[c] > 0;
  });

  return (
    <div className="w-full max-w-5xl mx-auto h-full flex flex-col justify-between overflow-hidden gap-1.5 sm:gap-2.5">
      {/* ══════════ MATCH COCKPIT CONTAINER (ZERO SCROLL IN BOTH ORIENTATIONS) ══════════ */}
      <div className="h-full flex flex-col justify-between overflow-hidden gap-1.5 sm:gap-2 landscape:grid landscape:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] landscape:gap-3 landscape:items-center">
        
        {/* Top in Portrait / Left Column in Landscape: Scoreboard Podium */}
        <div className="w-full shrink-0 landscape:h-full landscape:flex landscape:flex-col landscape:justify-center">
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
        </div>

        {/* Middle & Bottom in Portrait / Right Column in Landscape: Ball Rack & Big Control Deck */}
        <div className="w-full flex flex-col justify-between gap-1.5 sm:gap-2.5 landscape:h-full landscape:justify-center">
          {/* THE TABLE / BALL RACK ARENA */}
          <div className="w-full shrink-0">
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
          </div>

          {/* THE PRO CONTROL DECK — LARGE TACTILE COMMAND KEYS */}
          <div className="w-full shrink-0">
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
              onUndo={() => { tap(); undo(); setToast({ id: Date.now(), msg: "↺ Undone", tone: "info" }); }}
              onRedo={() => { setMoreOpen(false); tap(); redo(); setToast({ id: Date.now(), msg: "↻ Redone", tone: "info" }); }}
              onEndFrame={() => { setMoreOpen(false); handleEndFrame(); }}
            />
          </div>
        </div>
      </div>

      {/* Action consequence toast — flashes clearly on every scoring tap */}
      {toast ? (
        <ActionToast
          key={toast.id}
          message={toast.msg}
          tone={toast.tone}
          onDone={() => setToast(null)}
        />
      ) : null}
    </div>
  );
}