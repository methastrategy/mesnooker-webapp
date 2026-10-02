"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Activity,
  Play,
  RotateCcw,
  Target,
  Plus,
  Compass,
  Lightbulb,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useCoachStore, COACH_CUE_ID } from "@/store/coachStore";
import { useGameStore } from "@/store/gameStore";
import { BALL_COLORS, coachBrief, sideName, SPOTS } from "@/lib/geometry";
import { CoachTable, type ReplayState } from "@/components/coach/CoachTable";
import { CueTipPicker } from "@/components/coach/CueTipPicker";
import { cn } from "@/lib/utils";
import {
  playStrikeSound,
  playCueStrikeSound,
  playCushionSound,
  playPotSound,
  playPenaltySound,
} from "@/lib/sound";
import { t } from "@/lib/i18n";
import {
  SnookerPhysicsEngine,
  computeTrajectoryPreview,
  type BallPhysicsState,
} from "@/lib/physics";
import type { SolvePath, Vec, BallColor } from "@/lib/geometry";

const TRAY: BallColor[] = ["red", "yellow", "green", "brown", "blue", "pink"];
const POWER_PRESETS = [
  { label: "เบา 25%", value: 25 },
  { label: "กลาง 50%", value: 50 },
  { label: "แรง 75%", value: 75 },
  { label: "เต็มแรง 100%", value: 100 },
];

/**
 * 8 Ball Pool Style Vertical Pull-Back Power Slider (0–100%)
 * Pull down on cue stick to charge power; release to strike immediately.
 */
function VerticalPowerSlider({
  power,
  onChange,
  onReleaseStrike,
  disabled,
}: {
  power: number;
  onChange: (p: number) => void;
  onReleaseStrike: () => void;
  disabled: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const updateFromPointer = (clientY: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const top = r.top + 16;
    const bottom = r.bottom - 16;
    const height = Math.max(1, bottom - top);
    const clampedY = Math.max(top, Math.min(bottom, clientY));
    const pct = Math.round(((clampedY - top) / height) * 100);
    onChange(pct);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    updateFromPointer(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || disabled) return;
    updateFromPointer(e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    } catch {}
    if (power > 3 && !disabled) {
      onReleaseStrike();
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5 select-none touch-none shrink-0">
      {/* Power Percentage Readout Header */}
      <div className="flex items-center gap-1">
        <Zap
          size={13}
          className={cn(
            power > 70
              ? "text-rose-400"
              : power > 35
              ? "text-amber-400"
              : "text-emerald-400"
          )}
        />
        <span className="font-mono text-xs font-bold text-foreground">
          {power}%
        </span>
      </div>

      {/* Vertical Slider Track Container */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={cn(
          "relative h-44 w-12 rounded-2xl p-2 cursor-ns-resize transition-all",
          "bg-gradient-to-b from-black/85 via-black/70 to-black/85",
          "border border-white/10 shadow-inner flex flex-col items-center justify-between",
          isDragging && "border-gold/60 ring-2 ring-gold/25",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        title="ดึงลงเพื่อชาร์จแรงแทง · ปล่อยมือเพื่อแทง (Release to Strike)"
      >
        {/* Internal Fill Track with Gradient */}
        <div className="absolute inset-x-3.5 top-4 bottom-4 rounded-full bg-white/5 overflow-hidden">
          <div
            className="w-full rounded-full transition-all duration-75"
            style={{
              height: `${power}%`,
              background:
                "linear-gradient(to bottom, #10b981 0%, #f59e0b 55%, #ef4444 100%)",
              boxShadow: power > 0 ? "0 0 10px rgba(245, 158, 11, 0.4)" : "none",
            }}
          />
        </div>

        {/* Notch lines at 25%, 50%, 75% */}
        <div className="absolute top-[28%] left-1 right-1 flex items-center justify-between pointer-events-none opacity-40 text-[9px] font-mono text-white">
          <span className="w-1.5 h-[1px] bg-white" />
          <span>25</span>
          <span className="w-1.5 h-[1px] bg-white" />
        </div>
        <div className="absolute top-[50%] left-1 right-1 flex items-center justify-between pointer-events-none opacity-40 text-[9px] font-mono text-white">
          <span className="w-2 h-[1px] bg-white" />
          <span>50</span>
          <span className="w-2 h-[1px] bg-white" />
        </div>
        <div className="absolute top-[72%] left-1 right-1 flex items-center justify-between pointer-events-none opacity-40 text-[9px] font-mono text-white">
          <span className="w-1.5 h-[1px] bg-white" />
          <span>75</span>
          <span className="w-1.5 h-[1px] bg-white" />
        </div>

        {/* Moving Cue Stick Handle / Slider Knob */}
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none transition-transform duration-75"
          style={{
            top: `calc(16px + ${(power / 100) * 144}px - 14px)`,
          }}
        >
          {/* Cue Tip & Brass Ferrule Knob */}
          <div className="flex flex-col items-center">
            {/* Blue chalk tip */}
            <div className="h-1.5 w-4 rounded-t-sm bg-blue-600 shadow-sm" />
            {/* Brass ferrule */}
            <div className="h-2 w-5 rounded-sm bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 border border-amber-600 shadow-md flex items-center justify-center">
              <span className="h-0.5 w-2 bg-amber-800/40 rounded-full" />
            </div>
            {/* Wood shaft */}
            <div className="h-3 w-4 rounded-b-md bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 border-x border-amber-900/60" />
          </div>
        </div>
      </div>

      {/* Pull-back Hint */}
      <span className="text-[10px] text-muted-foreground text-center font-medium leading-tight">
        {isDragging ? "ปล่อยเพื่อแทง!" : "ดึงไม้ลง"}
      </span>
    </div>
  );
}

export default function SolvePage() {
  const store = useCoachStore();
  const locale = useGameStore((s) => s.locale);
  const [replay, setReplay] = useState<ReplayState | null>(null);
  const raf = useRef(0);
  const simRaf = useRef(0);

  const physicsEngineRef = useRef<SnookerPhysicsEngine | null>(null);
  const [simulatedBalls, setSimulatedBalls] = useState<BallPhysicsState[] | null>(null);
  const [preShotBalls, setPreShotBalls] = useState<typeof store.balls | null>(null);

  const cue = store.balls.find((b) => b.color === "cue");
  const obj = store.balls.find((b) => b.color === "black");
  const best: SolvePath | undefined =
    store.paths.find((p) => p.id === store.selectedPathId) ??
    store.paths.find((p) => !p.blocked) ??
    store.paths[0];

  useEffect(() => {
    return () => {
      cancelAnimationFrame(raf.current);
      cancelAnimationFrame(simRaf.current);
    };
  }, []);

  // Solve on initial load
  const solve = store.solve;
  useEffect(() => {
    solve();
  }, [solve]);

  // Live Trajectory Guidance preview in Practice Mode
  const trajectoryPreview = useMemo(() => {
    const cueBall = store.balls.find((b) => b.id === COACH_CUE_ID);
    if (!cueBall || store.isSimulating) return null;
    return computeTrajectoryPreview(
      cueBall.pos,
      store.aimAngleDeg,
      store.power,
      store.spin,
      store.balls
    );
  }, [store.balls, store.aimAngleDeg, store.power, store.spin, store.isSimulating]);

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

  // Interactive Practice: Strike Shot physics loop
  const handleStrike = useCallback(() => {
    if (store.isSimulating) return;

    // Snapshot pre-shot positions for quick retry
    setPreShotBalls(store.balls.map((b) => ({ ...b, pos: { ...b.pos } })));
    store.setShotOutcome(null);

    const engine = new SnookerPhysicsEngine(store.balls);
    physicsEngineRef.current = engine;

    const cueBall = store.balls.find((b) => b.id === COACH_CUE_ID);
    if (!cueBall) return;

    const ok = engine.strikeCue(
      {
        angleDeg: store.aimAngleDeg,
        power: store.power,
        spin: store.spin,
      },
      cueBall.id
    );

    if (!ok) return;

    playCueStrikeSound(store.power);
    store.setIsSimulating(true);

    let prevCushionCount = 0;
    let prevCollisionCount = 0;
    let prevPotCount = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.04, (now - lastTime) / 1000);
      lastTime = now;

      const stillMoving = engine.update(dt);

      // Sound triggers
      if (engine.cushionEvents.length > prevCushionCount) {
        const latest = engine.cushionEvents[engine.cushionEvents.length - 1];
        playCushionSound(latest.speed);
        prevCushionCount = engine.cushionEvents.length;
      }
      if (engine.collisionEvents.length > prevCollisionCount) {
        playStrikeSound(0.2);
        prevCollisionCount = engine.collisionEvents.length;
      }
      if (engine.potEvents.length > prevPotCount) {
        playPotSound(0.25);
        prevPotCount = engine.potEvents.length;
      }

      setSimulatedBalls(engine.getBalls());

      if (stillMoving) {
        simRaf.current = requestAnimationFrame(step);
      } else {
        const outcome = engine.evaluateOutcome(store.objectId);
        store.setShotOutcome(outcome);
        store.setIsSimulating(false);

        if (outcome.foul) {
          playPenaltySound(0.18);
        } else if (outcome.success) {
          playPotSound(0.2);
        }

        // Sync final resting ball positions back into coach store
        const finalBalls = engine.getBalls();
        for (const fb of finalBalls) {
          if (!fb.isPotted) {
            store.moveBall(fb.id, fb.pos, true);
          }
        }
        // If cue ball potted, reset to baulk
        const cueFb = finalBalls.find((b) => b.id === cueBall.id);
        if (cueFb?.isPotted) {
          store.moveBall(cueBall.id, { x: 330, y: 300 }, true);
        }
        // If target ball potted, respawn on black spot for subsequent drills
        const targetFb = finalBalls.find(
          (b) => b.id === store.objectId || b.color === "black"
        );
        if (targetFb?.isPotted) {
          store.moveBall(targetFb.id, { ...SPOTS.black }, true);
        }
        store.solve();
      }
    };

    simRaf.current = requestAnimationFrame(step);
  }, [store]);

  const handleRetryShot = useCallback(() => {
    cancelAnimationFrame(simRaf.current);
    if (store.isSimulating) {
      store.setIsSimulating(false);
    }
    if (preShotBalls) {
      for (const b of preShotBalls) {
        store.moveBall(b.id, b.pos, true);
      }
      store.solve();
    }
    setSimulatedBalls(null);
    store.setShotOutcome(null);
  }, [preShotBalls, store]);

  const handleAutoAimBlack = useCallback(() => {
    const cueBall = store.balls.find((b) => b.id === COACH_CUE_ID);
    const blackBall = store.balls.find((b) => b.color === "black");
    if (!cueBall || !blackBall) return;
    const dx = blackBall.pos.x - cueBall.pos.x;
    const dy = blackBall.pos.y - cueBall.pos.y;
    const deg = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    store.setAimAngle(Math.round(deg * 10) / 10);
  }, [store]);

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
                  setSimulatedBalls(null);
                  store.setMode("ai");
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                  store.mode === "ai"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Activity size={13} /> {t("solve.mode.ai", locale)}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplay(null);
                  store.setMode("practice");
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                  store.mode === "practice"
                    ? "bg-gold text-black shadow-md shadow-gold/25"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Play size={13} fill="currentColor" /> {t("solve.mode.practice", locale)}
              </button>
            </div>

            {store.mode === "ai" && best && !best.blocked && (
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
                cancelAnimationFrame(simRaf.current);
                setReplay(null);
                setSimulatedBalls(null);
                store.reset();
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
          {store.mode === "practice" && !store.isSimulating && (
            <div className="pointer-events-none absolute bottom-5 left-5 rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-white/80 border border-white/10">
              💡 แตะหรือลากบนสักหลาดเพื่อหมุนทิศทางไม้คิว · ลากลูกเพื่อจัดตำแหน่ง
            </div>
          )}
        </div>

        {/* Interactive Practice Control Dock (8-Ball Pool Cue Controls) */}
        {store.mode === "practice" && (
          <div className="glass flex flex-col gap-3 rounded-2xl p-4 border border-gold/20 shadow-xl bg-gradient-to-b from-white/[0.04] to-transparent">
            {/* Outcome Evaluation Toast / Banner */}
            {store.shotOutcome && (
              <div
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 border transition-all",
                  store.shotOutcome.success
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "bg-danger/15 border-danger/30 text-danger"
                )}
              >
                <div className="flex items-center gap-2.5">
                  {store.shotOutcome.success ? (
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle size={18} className="shrink-0 text-danger" />
                  )}
                  <div>
                    <div className="text-xs font-bold">
                      {store.shotOutcome.success
                        ? "🎉 แก้สนุ๊กสำเร็จ! ลูกขาวเข้ากระทบลูกดำสำเร็จ (Clean Escape Hit)"
                        : store.shotOutcome.foulReason || "แทงฟาวล์"}
                    </div>
                    <div className="text-[11px] opacity-80">
                      ชิ่งก่อนกระทบ: {store.shotOutcome.cushionsBeforeHit} ครั้ง · รวมชิ่งทั้งสิ้น:{" "}
                      {store.shotOutcome.totalCushionsHit} ครั้ง
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRetryShot}
                    className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-foreground transition-colors"
                  >
                    <RotateCcw size={13} /> {t("solve.retry", locale)}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Aim Angle Controller with Fine-tuning Buttons */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Compass size={14} className="text-primary" />
                    {t("solve.aimAngle", locale)}:
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleAutoAimBlack}
                      className="rounded-md bg-white/5 hover:bg-white/10 px-2 py-0.5 text-[11px] font-medium text-gold border border-gold/30 transition-colors"
                      title="หันไม้คิวเล็งไปยังลูกดำโดยตรง"
                    >
                      {t("solve.autoAim", locale)}
                    </button>
                    {best && (
                      <button
                        type="button"
                        onClick={() => store.syncAimFromSolver()}
                        className="rounded-md bg-primary/10 hover:bg-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary border border-primary/30 transition-colors"
                        title="ใช้มุมที่ AI แนะนำให้แก้ชิ่ง"
                      >
                        {t("solve.syncAi", locale)}
                      </button>
                    )}
                  </div>
                </div>

                {/* Angle fine tuning buttons */}
                <div className="flex items-center justify-between gap-1 rounded-xl bg-black/40 p-1.5 border border-white/10">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => store.adjustAimAngle(-1.0)}
                      className="rounded-lg bg-white/5 hover:bg-white/15 px-2.5 py-1 text-xs font-mono font-bold text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                      title="หมุนซ้าย -1.0°"
                    >
                      -1°
                    </button>
                    <button
                      type="button"
                      onClick={() => store.adjustAimAngle(-0.1)}
                      className="rounded-lg bg-white/5 hover:bg-white/15 px-2 py-1 text-xs font-mono font-bold text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                      title="หมุนละเอียดซ้าย -0.1°"
                    >
                      -0.1°
                    </button>
                  </div>

                  <div className="text-center">
                    <span className="font-mono text-base font-bold text-gold">
                      {store.aimAngleDeg.toFixed(1)}°
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => store.adjustAimAngle(0.1)}
                      className="rounded-lg bg-white/5 hover:bg-white/15 px-2 py-1 text-xs font-mono font-bold text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                      title="หมุนละเอียดขวา +0.1°"
                    >
                      +0.1°
                    </button>
                    <button
                      type="button"
                      onClick={() => store.adjustAimAngle(1.0)}
                      className="rounded-lg bg-white/5 hover:bg-white/15 px-2.5 py-1 text-xs font-mono font-bold text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                      title="หมุนขวา +1.0°"
                    >
                      +1°
                    </button>
                  </div>
                </div>
              </div>

              {/* 8 Ball Pool Style Vertical Pull-Back Power Slider & Strike Action */}
              <div className="flex items-center gap-3.5 bg-black/40 p-3 rounded-xl border border-white/10 shadow-inner">
                {/* 8 Ball Pool Vertical Power Cue Track */}
                <VerticalPowerSlider
                  power={store.power}
                  onChange={store.setPower}
                  onReleaseStrike={handleStrike}
                  disabled={store.isSimulating}
                />

                <div className="flex flex-1 flex-col justify-between gap-2.5 h-full py-0.5">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <Zap size={14} className="text-amber-400" />
                        {t("solve.powerSlider", locale)}:
                      </span>
                      <span className="font-mono text-sm font-bold text-gold">
                        {store.power}%
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
                      ดึงไม้คิวแนวตั้งลงเพื่อชาร์จแรง แล้วปล่อยมือเพื่อแทงทันที (8 Ball Pool style) หรือกดปุ่มลัด
                    </p>
                  </div>

                  {/* Preset Power Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {POWER_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => store.setPower(p.value)}
                        className={cn(
                          "rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all active:scale-95 text-center",
                          store.power === p.value
                            ? "bg-amber-400/25 text-amber-300 font-bold border border-amber-400/40 shadow-sm"
                            : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground border border-white/5"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Big STRIKE Button */}
                  <button
                    type="button"
                    onClick={handleStrike}
                    disabled={store.isSimulating}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold text-xs shadow-xl transition-all active:scale-95",
                      store.isSimulating
                        ? "bg-muted text-muted-foreground cursor-not-allowed animate-pulse"
                        : "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/25 hover:brightness-110"
                    )}
                  >
                    <Play size={14} fill="currentColor" />
                    {store.isSimulating ? t("solve.strike.running", locale) : t("solve.strike", locale)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clean Controls Toolbar (Ball Tray & Setup) */}
        <div className="glass flex flex-col gap-3 rounded-2xl p-4 border border-white/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Target ball indicator (Permanently Black) */}
            <div className="flex items-center gap-2">
              <Target size={16} className="text-gold" />
              <span className="text-xs font-semibold text-muted-foreground">
                {t("solve.target", locale)}:
              </span>
              <span
                className="inline-block h-5 w-5 rounded-full border border-black/40 shadow-sm"
                style={{ background: BALL_COLORS.black }}
              />
              <span className="text-sm font-bold text-foreground">
                {t("solve.target.black", locale)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                {t("solve.ballsOnTable", locale)}:{" "}
                <strong className="text-foreground">{store.balls.length}</strong> ·{" "}
                {t("solve.dragHint", locale)}
              </span>
            </div>
          </div>

          {/* Add Ball Tray (Blockers Only) */}
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <Plus size={13} /> {t("solve.addBlocker", locale)}
            </span>
            <div className="flex items-center gap-1">
              {TRAY.map((c) => (
                <button
                  key={c}
                  onClick={() => store.addBall(c)}
                  aria-label={`Add ${c}`}
                  title={`Add ${c} ball`}
                  className="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center p-1 rounded-full cursor-pointer hover:bg-surface transition-colors"
                >
                  <span
                    className="h-6 w-6 rounded-full border border-black/40 shadow-xs transition-transform hover:scale-110 active:scale-95 block"
                    style={{
                      background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.7), ${
                        BALL_COLORS[c]
                      } 65%)`,
                    }}
                  />
                </button>
              ))}
            </div>
            <span className="ml-auto text-[11px] text-muted-foreground">
              {t("solve.blockerHint", locale)}
            </span>
          </div>
        </div>
      </div>

      {/* Right Sidebar: AI Escape & English Spin Guide */}
      <div className="w-full lg:w-84 lg:shrink-0">
        <aside className="rounded-[10px] border border-border bg-card flex flex-col gap-4 p-4 lg:sticky lg:top-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {store.mode === "practice" ? "ข้อมูลและจุดแทงลูก" : t("solve.advice.title", locale)}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {store.mode === "practice" ? "ตั้งไซด์/สกรู และวิเคราะห์หน้าไม้" : t("solve.advice.subtitle", locale)}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                store.mode === "practice"
                  ? "bg-gold/20 text-gold"
                  : store.solved && best && !best.blocked
                  ? "bg-primary/20 text-primary"
                  : "bg-danger/20 text-danger"
              )}
            >
              {store.mode === "practice"
                ? "ซ้อมแทงเอง"
                : store.solved && best && !best.blocked
                ? t("solve.status.found", locale)
                : t("solve.status.blocked", locale)}
            </span>
          </div>

          {/* Interactive Cue Tip Spin & English Control */}
          <div className="rounded-[20px] border border-border/80 bg-surface/85 backdrop-blur-xl p-4 flex flex-col items-center shadow-sm">
            <div className="mb-2.5 flex w-full items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                <Compass size={14} className="text-primary" />
                {t("solve.spin.title", locale)}
              </span>
              {brief?.recommendedTip && (
                <span className="rounded-full bg-gold/20 border border-gold/40 px-2 py-0.5 text-[10px] font-mono font-bold text-gold">
                  {t("solve.spin.recommended", locale)}: {brief.recommendedTip}
                </span>
              )}
            </div>

            <CueTipPicker recommendedId={brief?.recommendedTip} />

            {brief?.recommendedTipNote && (
              <div className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-xl bg-primary/10 p-2.5 text-center text-xs font-medium text-primary border border-primary/20">
                <Lightbulb size={13} className="shrink-0 text-primary" />
                <span>{brief.recommendedTipNote}</span>
              </div>
            )}
          </div>

          {/* Practice Mode Live Raycast Feedback */}
          {store.mode === "practice" ? (
            <div className="flex flex-col gap-3">
              {trajectoryPreview ? (
                <div className="rounded-xl bg-white/5 p-3.5 border border-white/10 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">เป้าหมายสัมผัสแรก:</span>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                        trajectoryPreview.isTargetHit
                          ? "bg-emerald-500/20 text-emerald-400"
                          : trajectoryPreview.firstHitBall
                          ? "bg-danger/20 text-danger"
                          : "bg-sky-500/20 text-sky-400"
                      )}
                    >
                      {trajectoryPreview.isTargetHit
                        ? "โดนลูกดำ (เป้าหมาย)"
                        : trajectoryPreview.firstHitBall
                        ? `โดนลูก${trajectoryPreview.firstHitBall.color.toUpperCase()} (ขวาง)`
                        : "ไม่โดนลูกใด"}
                    </span>
                  </div>

                  {trajectoryPreview.thicknessLabel && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-muted-foreground">ความหนาในการสัมผัส:</span>
                      <span className="font-bold text-primary">
                        {trajectoryPreview.thicknessLabel}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">จำนวนชิ่งบนวิถี:</span>
                    <span className="font-mono font-bold text-gold">
                      {trajectoryPreview.cushionBounces.length} ชิ่ง
                    </span>
                  </div>
                </div>
              ) : null}

              {/* AI Guidance reference card in practice mode */}
              {best && (
                <div className="rounded-xl bg-primary/10 p-3 border border-primary/20 text-xs">
                  <div className="font-bold text-primary flex items-center gap-1">
                    <Sparkles size={13} /> มุมแนะนำจาก AI:
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    ชิ่ง {best.cushions} ครั้ง ({best.sideSequence.map((s) => sideName(s)).join(" ➔ ")}) · ระดับความยาก {best.difficulty}/10
                  </div>
                </div>
              )}
            </div>
          ) : !best || best.blocked || !brief ? (
            <div className="rounded-xl bg-white/5 p-4 text-xs leading-relaxed text-muted-foreground border border-danger/20">
              <p className="font-semibold text-danger">{t("solve.blocked.title", locale)}</p>
              <p className="mt-2">{t("solve.blocked.desc", locale)}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Summary Card */}
              <div className="rounded-xl bg-primary/10 p-3.5 border border-primary/20">
                <div className="text-[11px] uppercase tracking-wider text-primary font-bold">
                  {t("solve.best.title", locale)}
                </div>
                <div className="mt-1 text-base font-bold text-foreground">
                  {best.cushions === 0
                    ? t("solve.best.straight", locale)
                    : `${t("solve.best.cushions", locale)} ${best.cushions} ${t(
                        "solve.best.times",
                        locale
                      )} (${best.sideSequence.map((s) => sideName(s)).join(" ➔ ")})`}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {t("solve.difficulty", locale)}:{" "}
                  <span
                    className={cn(
                      "font-bold",
                      best.difficulty < 3
                        ? "text-primary"
                        : best.difficulty < 6
                        ? "text-gold"
                        : "text-danger"
                    )}
                  >
                    {best.difficulty}/10
                  </span>
                </div>
              </div>

              {/* Aim Point */}
              <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("solve.aim.title", locale)}
                </div>
                <div className="mt-1 text-sm font-bold text-gold">
                  {brief.aimAngleDeg}
                  {t("solve.aim.deg", locale)}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {best.cushionNotes.length > 0
                    ? `กระทบชิ่งแรก: ชิ่ง${sideName(
                        best.cushionNotes[0].side
                      )} ที่ตำแหน่งประมาณ ${Math.round(
                        (best.cushionNotes[0].side === "l" ||
                        best.cushionNotes[0].side === "r"
                          ? best.cushionNotes[0].point.y / 600
                          : best.cushionNotes[0].point.x / 1200) * 100
                      )}% ของความยาวชิ่ง`
                    : t("solve.aim.straight", locale)}
                </div>
              </div>

              {/* Hit Thickness */}
              <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("solve.thickness.title", locale)}
                </div>
                <div className="mt-1 text-sm font-bold text-primary">
                  {brief.thicknessLabel}
                </div>
              </div>

              {/* Power Suggestion */}
              <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("solve.power.title", locale)}
                </div>
                <div className="mt-1 text-sm font-bold text-foreground">
                  {brief.powerLabel}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
