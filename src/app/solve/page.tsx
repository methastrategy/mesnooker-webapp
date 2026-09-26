"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Play,
  RotateCcw,
  Target,
  Plus,
  Compass,
} from "lucide-react";
import { useCoachStore } from "@/store/coachStore";
import { useGameStore } from "@/store/gameStore";
import { BALL_COLORS, coachBrief, sideName } from "@/lib/geometry";
import { CoachTable, type ReplayState } from "@/components/coach/CoachTable";
import { CueTipPicker } from "@/components/coach/CueTipPicker";
import { cn } from "@/lib/utils";
import { playStrikeSound } from "@/lib/sound";
import { t } from "@/lib/i18n";
import type { SolvePath, Vec, BallColor } from "@/lib/geometry";

const TRAY: BallColor[] = ["red", "yellow", "green", "brown", "blue", "pink"];

export default function SolvePage() {
  const store = useCoachStore();
  const locale = useGameStore((s) => s.locale);
  const [replay, setReplay] = useState<ReplayState | null>(null);
  const raf = useRef(0);

  const cue = store.balls.find((b) => b.color === "cue");
  const obj = store.balls.find((b) => b.color === "black");
  const best: SolvePath | undefined =
    store.paths.find((p) => p.id === store.selectedPathId) ??
    store.paths.find((p) => !p.blocked) ??
    store.paths[0];

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // Solve on initial load or ball move
  useEffect(() => {
    store.solve();
  }, []);

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

    // 8-Ball Pool style velocity pacing: ~650px per second with natural deceleration
    const cueDur = Math.max(700, Math.min(2200, (totalCueLen / 650) * 1000));
    const objDur = 750;
    const t0 = performance.now();
    let hasStruck = false;

    const targetEnd = best.objectPolyline[1] ?? {
      x: obj.pos.x + 80 * ((obj.pos.x - best.ghost.x) / (Math.hypot(obj.pos.x - best.ghost.x, obj.pos.y - best.ghost.y) || 1)),
      y: obj.pos.y + 80 * ((obj.pos.y - best.ghost.y) / (Math.hypot(obj.pos.x - best.ghost.x, obj.pos.y - best.ghost.y) || 1)),
    };

    const step = (now: number) => {
      const el = now - t0;
      if (el < cueDur) {
        // Cue ball roll with natural rolling progress
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
        // Target ball reaction with ease-out quadratic deceleration
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
          <div className="flex items-center gap-2">
            {best && !best.blocked && (
              <button
                onClick={runReplay}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95"
              >
                <Play size={14} fill="currentColor" /> {t("solve.replay", locale)}
              </button>
            )}
            <button
              onClick={() => {
                cancelAnimationFrame(raf.current);
                setReplay(null);
                store.reset();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground active:scale-95"
            >
              <RotateCcw size={14} /> {t("solve.reset", locale)}
            </button>
          </div>
        </header>

        {/* Clean Snooker Table */}
        <div className="glass overflow-hidden rounded-2xl p-2 sm:p-3 border border-white/5 shadow-2xl">
          <CoachTable aimLine={null} replay={replay} />
        </div>

        {/* Clean Controls Toolbar */}
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
                {t("solve.ballsOnTable", locale)}: <strong className="text-foreground">{store.balls.length}</strong> · {t("solve.dragHint", locale)}
              </span>
            </div>
          </div>

          {/* Add Ball Tray (Blockers Only) */}
          <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
            <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <Plus size={13} /> {t("solve.addBlocker", locale)}
            </span>
            {TRAY.map((c) => (
              <button
                key={c}
                onClick={() => store.addBall(c)}
                aria-label={`Add ${c}`}
                title={`Add ${c} ball`}
                className="h-7 w-7 rounded-full border border-black/40 shadow transition-transform hover:scale-115 active:scale-95"
                style={{
                  background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.7), ${
                    BALL_COLORS[c]
                  } 65%)`,
                }}
              />
            ))}
            <span className="ml-auto text-[11px] text-muted-foreground">
              {t("solve.blockerHint", locale)}
            </span>
          </div>
        </div>
      </div>

      {/* Right Sidebar: AI Escape & English Spin Guide */}
      <div className="w-full lg:w-84 lg:shrink-0">
        <aside className="glass flex flex-col gap-4 rounded-2xl p-4 lg:sticky lg:top-6 border border-white/5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">{t("solve.advice.title", locale)}</h2>
              <p className="text-[11px] text-muted-foreground">{t("solve.advice.subtitle", locale)}</p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                store.solved && best && !best.blocked
                  ? "bg-primary/20 text-primary"
                  : "bg-danger/20 text-danger"
              )}
            >
              {store.solved && best && !best.blocked
                ? t("solve.status.found", locale)
                : t("solve.status.blocked", locale)}
            </span>
          </div>

          {/* Interactive Cue Tip Spin & English Control */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 flex flex-col items-center">
            <div className="mb-2 flex w-full items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Compass size={14} className="text-primary" />
                {t("solve.spin.title", locale)}
              </span>
              {brief?.recommendedTip && (
                <span className="rounded bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold">
                  {t("solve.spin.recommended", locale)}: {brief.recommendedTip}
                </span>
              )}
            </div>

            <CueTipPicker recommendedId={brief?.recommendedTip} />

            {brief?.recommendedTipNote && (
              <div className="mt-3 w-full rounded-lg bg-primary/10 p-2.5 text-center text-xs font-medium text-primary border border-primary/20">
                💡 {brief.recommendedTipNote}
              </div>
            )}
          </div>

          {!best || best.blocked || !brief ? (
            <div className="rounded-xl bg-white/5 p-4 text-xs leading-relaxed text-muted-foreground border border-danger/20">
              <p className="font-semibold text-danger">
                {t("solve.blocked.title", locale)}
              </p>
              <p className="mt-2">
                {t("solve.blocked.desc", locale)}
              </p>
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
                    : `${t("solve.best.cushions", locale)} ${best.cushions} ${t("solve.best.times", locale)} (${best.sideSequence.map(s => sideName(s)).join(" ➔ ")})`}
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
                  {brief.aimAngleDeg}{t("solve.aim.deg", locale)}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {best.cushionNotes.length > 0
                    ? `กระทบชิ่งแรก: ชิ่ง${sideName(best.cushionNotes[0].side)} ที่ตำแหน่งประมาณ ${Math.round(
                        ((best.cushionNotes[0].side === "l" || best.cushionNotes[0].side === "r")
                          ? best.cushionNotes[0].point.y / 600
                          : best.cushionNotes[0].point.x / 1200
                        ) * 100
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
