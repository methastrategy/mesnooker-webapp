"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Play, RotateCcw } from "lucide-react";
import { useCoachStore } from "@/store/coachStore";
import { useGameStore } from "@/store/gameStore";
import { coachBrief } from "@/lib/geometry";
import { CoachTable, type ReplayState } from "@/components/coach/CoachTable";
import { PracticeControlDock } from "@/components/coach/PracticeControlDock";
import { BallTrayToolbar } from "@/components/coach/BallTrayToolbar";
import { EscapeSidebar } from "@/components/coach/EscapeSidebar";
import { useEscapeSimulation } from "@/hooks/useEscapeSimulation";
import { playStrikeSound } from "@/lib/sound";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { SolvePath, Vec } from "@/lib/geometry";

export default function SolvePage() {
  const mode = useCoachStore((s) => s.mode);
  const balls = useCoachStore((s) => s.balls);
  const paths = useCoachStore((s) => s.paths);
  const selectedPathId = useCoachStore((s) => s.selectedPathId);
  const setMode = useCoachStore((s) => s.setMode);
  const reset = useCoachStore((s) => s.reset);
  const solve = useCoachStore((s) => s.solve);
  const locale = useGameStore((s) => s.locale);

  const {
    simulatedBalls,
    trajectoryPreview,
    shotOutcome,
    isSimulating,
    handleStrike,
    handleRetryShot,
    handleAutoAimBlack,
    resetSimulation,
  } = useEscapeSimulation();

  const [replay, setReplay] = useState<ReplayState | null>(null);
  const raf = useRef(0);

  const cue = balls.find((b) => b.color === "cue");
  const obj = balls.find((b) => b.color === "black");
  const best: SolvePath | undefined =
    paths.find((p) => p.id === selectedPathId) ??
    paths.find((p) => !p.blocked) ??
    paths[0];

  useEffect(() => {
    return () => {
      cancelAnimationFrame(raf.current);
    };
  }, []);

  // Solve on initial load
  useEffect(() => {
    solve();
  }, [solve]);

  // AI Replay animation
  function pointAlong(points: Vec[], tVal: number): Vec {
    const lens: number[] = [];
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const L = Math.hypot(
        points[i + 1].x - points[i].x,
        points[i + 1].y - points[i].y
      );
      lens.push(L);
      total += L;
    }
    if (total === 0) return points[0];
    let d = tVal * total;
    for (let i = 0; i < lens.length; i++) {
      if (d <= lens[i] || i === lens.length - 1) {
        const f = lens[i] === 0 ? 0 : Math.min(1, d / lens[i]);
        return {
          x: points[i].x + (points[i + 1].x - points[i].x) * f,
          y: points[i].y + (points[i + 1].y - points[i].y) * f,
        };
      }
      d -= lens[i];
    }
    return points[points.length - 1];
  }

  function runReplay() {
    if (!best || !cue || !obj) return;
    cancelAnimationFrame(raf.current);

    const cuePoints: Vec[] = best.cuePolyline;
    let totalCueLen = 0;
    for (let i = 0; i < cuePoints.length - 1; i++) {
      totalCueLen += Math.hypot(
        cuePoints[i + 1].x - cuePoints[i].x,
        cuePoints[i + 1].y - cuePoints[i].y
      );
    }

    const cueDur = Math.max(700, Math.min(2200, (totalCueLen / 650) * 1000));
    const objDur = 750;
    const t0 = performance.now();
    let hasStruck = false;

    const targetEnd = best.objectPolyline[1] ?? {
      x:
        obj.pos.x +
        80 *
          ((obj.pos.x - best.ghost.x) /
            (Math.hypot(obj.pos.x - best.ghost.x, obj.pos.y - best.ghost.y) || 1)),
      y:
        obj.pos.y +
        80 *
          ((obj.pos.y - best.ghost.y) /
            (Math.hypot(obj.pos.x - best.ghost.x, obj.pos.y - best.ghost.y) || 1)),
    };

    const step = (now: number) => {
      const el = now - t0;
      if (el < cueDur) {
        const linearT = el / cueDur;
        const easeT = Math.sin((linearT * Math.PI) / 2);
        const p = pointAlong(cuePoints, easeT);
        setReplay({ cue: p, object: null, phase: "cue" });
        raf.current = requestAnimationFrame(step);
        return;
      }
      const el2 = el - cueDur;
      if (el2 < objDur) {
        if (!hasStruck) {
          hasStruck = true;
          playStrikeSound(0.18);
        }
        const objT = el2 / objDur;
        const easeOut = 1 - Math.pow(1 - objT, 2.2);
        setReplay({
          cue: best.ghost,
          object: {
            x: obj.pos.x + (targetEnd.x - obj.pos.x) * easeOut,
            y: obj.pos.y + (targetEnd.y - obj.pos.y) * easeOut,
          },
          phase: "object",
        });
        raf.current = requestAnimationFrame(step);
        return;
      }
      setReplay({ cue: best.ghost, object: targetEnd, phase: "done" });
    };
    raf.current = requestAnimationFrame(step);
  }

  const brief = best && obj ? coachBrief(best, obj.pos, best.objectPolyline[1] ?? obj.pos) : null;

  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {/* Page Header */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Activity size={18} />
              </span>
              <h1 className="text-xl font-bold tracking-tight">
                {t("solve.title", locale)}
              </h1>
              <span className="rounded-md bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">
                {t("solve.tag", locale)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground max-w-2xl leading-relaxed">
              {t("solve.desc", locale)}
            </p>
          </div>

          {/* Mode Switcher Toggle: AI Advisor vs Take the Shot */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl bg-white/5 p-1 border border-white/10 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  resetSimulation();
                  setMode("ai");
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                  mode === "ai"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Activity size={13} /> {t("solve.mode.ai", locale)}
              </button>
              <button
                type="button"
                onClick={() => {
                  cancelAnimationFrame(raf.current);
                  setReplay(null);
                  setMode("practice");
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                  mode === "practice"
                    ? "bg-gold text-black shadow-md shadow-gold/25"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Play size={13} fill="currentColor" /> {t("solve.mode.practice", locale)}
              </button>
            </div>

            {mode === "ai" && best && !best.blocked && (
              <button
                type="button"
                onClick={runReplay}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95"
              >
                <Play size={14} fill="currentColor" /> {t("solve.replay", locale)}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                cancelAnimationFrame(raf.current);
                setReplay(null);
                resetSimulation();
                reset();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground active:scale-95"
              title="รีเซ็ตตำแหน่งลูกทั้งหมดบนโต๊ะ"
            >
              <RotateCcw size={14} /> {t("solve.reset", locale)}
            </button>
          </div>
        </header>

        {/* Clean Snooker Table with 8-Ball Pool Guide & Physics Integration */}
        <div className="glass relative overflow-hidden rounded-2xl p-2 sm:p-3 border border-white/5 shadow-2xl">
          <CoachTable aimLine={null} replay={replay} simulatedBalls={simulatedBalls} />

          {/* Interactive touch-to-aim prompt overlay in practice mode */}
          {mode === "practice" && !isSimulating && (
            <div className="pointer-events-none absolute bottom-5 left-5 rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-white/80 border border-white/10">
              💡 แตะหรือลากบนสักหลาดเพื่อหมุนทิศทางไม้คิว · ลากลูกเพื่อจัดตำแหน่ง
            </div>
          )}
        </div>

        {/* Interactive Practice Control Dock (8-Ball Pool Cue Controls) */}
        {mode === "practice" && (
          <PracticeControlDock
            shotOutcome={shotOutcome}
            isSimulating={isSimulating}
            best={best}
            onStrike={handleStrike}
            onRetry={handleRetryShot}
            onAutoAimBlack={handleAutoAimBlack}
          />
        )}

        {/* Clean Controls Toolbar (Ball Tray & Setup) */}
        <BallTrayToolbar />
      </div>

      {/* Right Sidebar: AI Escape & English Spin Guide */}
      <EscapeSidebar
        best={best}
        brief={brief}
        trajectoryPreview={trajectoryPreview}
      />
    </div>
  );
}
