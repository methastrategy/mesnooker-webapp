"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { useGameStore, useActiveFrame, useRunningBalance } from "@/store/gameStore";
import { BallPad } from "@/components/game/BallPad";
import { TurnHeader } from "@/components/game/TurnHeader";
import { ClearRack } from "@/components/game/ClearRack";
import { ControlDock } from "@/components/game/ControlDock";
import { ActionToast } from "@/components/game/ActionToast";
import { FoulOptionsSheet } from "@/components/game/FoulOptionsSheet";
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
import { useWakeLock } from "@/hooks/useWakeLock";
import { playPotSound, playPenaltySound } from "@/lib/sound";

type ToastTone = "info" | "success" | "danger";

export function LiveMatch({ onPause }: {
  onPause?: () => void;
  /** @deprecated accepted for signature parity; completion flows via onPause → FramePauseSummary */
  onFinish?: (a: ArchivedGame) => void;
}) {
  const frame = useActiveFrame();
  const running = useRunningBalance();
  const { isActive: wakeLockActive } = useWakeLock(true);
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
  const settingsOpen = useGameStore((s) => s.settingsOpen);
  const freeBallActive = useGameStore((s) => s.freeBallActive);

  const pot = useGameStore((s) => s.pot);
  const applyScoring = useGameStore((s) => s.applyScoring);
  const endTurn = useGameStore((s) => s.endTurn);
  const endFrame = useGameStore((s) => s.endFrame);
  const undo = useGameStore((s) => s.undo);
  const redo = useGameStore((s) => s.redo);
  const setFreeBall = useGameStore((s) => s.setFreeBall);
  const foulWithOptions = useGameStore((s) => s.foulWithOptions);
  const playAgain = useGameStore((s) => s.playAgain);
  const rerack = useGameStore((s) => s.rerack);
  const concede = useGameStore((s) => s.concede);

  const frameStartedAt = frame?.startedAt;
  const sessionClock = useElapsedSum(frames);
  const frameClock = useElapsed(frameStartedAt);
  const [moreOpen, setMoreOpen] = useState(false);
  const [foulOptionsOpen, setFoulOptionsOpen] = useState(false);
  const [toast, setToast] = useState<{ id: number; msg: string; tone: ToastTone } | null>(null);

  const shooter = players[shooterIndex];
  const targetId = frame?.targetCycle?.[shooter?.id];
  const targetName = players.find((p) => p.id === targetId)?.nickname;

  const events = allEvents.filter((e) => e.frameId === frame?.id && !e.undone);

  // Break engine: legal phase + consecutive break count for the current shooter
  const phase = inferBreakPhase(events, shooter?.id ?? "");
  const breakCount = currentBreakCount(events, shooter?.id ?? "");
  // When free ball is active, any colour remaining on the table can be nominated as a red
  const legal = freeBallActive
    ? (BALL_ORDER.filter((c) => c !== "red" && ballCounts[c] > 0) as BallColor[])
    : legalBalls(phase, ballCounts);
  const canStartBreak = phase === BreakPhase.COLOUR;
  const clearingColours = ballCounts.red === 0;
  const clearOrderLocked = clearingColours && phase === BreakPhase.RED_FIRST && !freeBallActive;
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
    const isFree = freeBallActive;
    setToast({
      id: Date.now(),
      msg: isFree ? `⭐ Free Ball ${BALL_NAME[ball]} (+1 pt)` : `${BALL_NAME[ball]} potted`,
      tone: isFree ? "success" : "info",
    });
  }, [tap, pot, onPause, haptics, freeBallActive]);

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

  // Keyboard shortcuts for effortless PC match play with repeat guard and modal suppression
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.repeat) return; // Prevent key repeat flooding (BUG-04)
      if (moreOpen || foulOptionsOpen || settingsOpen) return; // Ignore hotkeys while modals/sheets are open (BUG-04)
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
  }, [canUndo, endTurn, undo, mode, legal, nextShooter, onPot, scoringAction, tap, moreOpen, foulOptionsOpen, settingsOpen]);

  if (!frame || !session) {
    return (
      <div className="mx-auto flex w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl h-full items-center justify-center">
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
    <div className="w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto h-full flex flex-col justify-between overflow-hidden gap-1.5 sm:gap-2.5">
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
            targetCycle={frame?.targetCycle}
            wakeLockActive={wakeLockActive}
          />
        </div>

        {/* Middle & Bottom in Portrait / Right Column in Landscape: Ball Rack & Big Control Deck */}
        <div className="w-full flex flex-col justify-between gap-1.5 sm:gap-2.5 landscape:h-full landscape:justify-center">
          
          {/* Active Free Ball Glow Banner */}
          {freeBallActive && (
            <div className="w-full rounded-2xl border border-amber-400/80 bg-amber-500/20 px-3 py-1.5 flex items-center justify-between gap-2 text-amber-300 animate-pulse shadow-md">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400 shrink-0" />
                <span className="text-xs font-black tracking-wide">
                  FREE BALL ACTIVE: เลือกตบสีใดก็ได้ มีค่าเท่ากับลูกแดง (+1)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFreeBall(false)}
                className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-black/40 hover:bg-black/70 border border-white/20 text-foreground cursor-pointer"
              >
                ยกเลิก (Cancel)
              </button>
            </div>
          )}

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
              onReRack={() => {
                rerack();
                setToast({ id: Date.now(), msg: "🔄 ขอเริ่มเฟรมใหม่ (Re-rack 0-0)", tone: "info" });
              }}
              onConcede={() => {
                concede();
                if (onPause) onPause();
              }}
              onOpenFoulOptions={() => setFoulOptionsOpen(true)}
              onPlayAgain={() => {
                playAgain();
                setToast({ id: Date.now(), msg: "🔁 ให้แทงซ้ำ (Play Again)", tone: "info" });
              }}
              onToggleFreeBall={() => {
                const nextVal = !freeBallActive;
                setFreeBall(nextVal);
                if (nextVal) {
                  setToast({ id: Date.now(), msg: "⭐ เปิดใช้งานฟรีบอล (Free Ball Active)", tone: "success" });
                }
              }}
              freeBallActive={freeBallActive}
            />
          </div>
        </div>
      </div>

      {/* Foul Options & Play Again Sheet */}
      <FoulOptionsSheet
        open={foulOptionsOpen}
        onClose={() => setFoulOptionsOpen(false)}
        mode={mode}
        onApplyFoul={(points, playAgainShot) => {
          tap("penalty");
          foulWithOptions({ points, playAgain: playAgainShot });
          const freshFrames = useGameStore.getState().frames;
          const freshFrame = freshFrames[freshFrames.length - 1];
          if (freshFrame?.endedAt && onPause) {
            setToast({ id: Date.now(), msg: "⬛ Foul on black — frame over!", tone: "danger" });
            setTimeout(() => onPause(), 600);
            return;
          }
          setToast({
            id: Date.now(),
            msg: `Foul -${points}${playAgainShot ? " · ให้คนเดิมแทงซ้ำ" : ` · → ${nextShooter()?.nickname ?? "next"}`}`,
            tone: "danger",
          });
        }}
        onActivateFreeBall={() => {
          setFreeBall(true);
          setToast({ id: Date.now(), msg: "⭐ ประกาศฟรีบอล (Free Ball Active)", tone: "success" });
        }}
      />

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