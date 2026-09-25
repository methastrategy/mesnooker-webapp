"use client";

/**
 * /solve — Snooker Escape Solver + Shot Analyzer.
 * Layout: table + controls + path list + analyzer (left), AI Coach (right).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Play,
  RotateCcw,
  Target,
  Trash2,
  Dices,
} from "lucide-react";
import { useCoachStore } from "@/store/coachStore";
import { POCKET_MAP, BALL_COLORS } from "@/lib/geometry";
import { analyzeShot, type ShotVerdict } from "@/lib/coach/analysis";
import { takeHandOffDrill } from "@/lib/coach/drills";
import { CoachTable, type ReplayState } from "@/components/coach/CoachTable";
import { AiCoachPanel } from "@/components/coach/AiCoachPanel";
import { cn } from "@/lib/utils";
import type { SolvePath, Vec, BallColor } from "@/lib/geometry";

const TRAY: BallColor[] = ["red", "yellow", "green", "brown", "blue", "pink", "black"];

export default function SolvePage() {
  const store = useCoachStore();
  const [aimLine, setAimLine] = useState<{ from: Vec; to: Vec } | null>(null);
  const [replay, setReplay] = useState<ReplayState | null>(null);
  const raf = useRef(0);

  const cue = store.balls.find((b) => b.color === "cue");
  const obj = store.balls.find((b) => b.id === store.objectId);
  const best: SolvePath | undefined =
    store.paths.find((p) => p.id === store.selectedPathId) ??
    store.paths.find((p) => !p.blocked) ??
    store.paths[0];

  // drill handoff from /practice
  useEffect(() => {
    const d = takeHandOffDrill();
    if (d) store.loadDrill(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // aim line becomes stale when the solve changes
  useEffect(() => setAimLine(null), [store.solved, store.selectedPathId]);

  const verdict: ShotVerdict | null = useMemo(() => {
    if (!aimLine || !cue || !obj || !best) return null;
    if (Math.hypot(aimLine.to.x - aimLine.from.x, aimLine.to.y - aimLine.from.y) < 20)
      return null;
    try {
      return analyzeShot(cue.pos, aimLine.to, best, obj.pos);
    } catch {
      return null;
    }
  }, [aimLine, cue, obj, best]);

  const pocket = POCKET_MAP[store.pocketId];

  // ── replay engine ───────────────────────────────────────────────────
  function pointAlong(points: Vec[], t: number): Vec {
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
    let d = t * total;
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

  function runReplay(kind: "best" | "mine") {
    if (!best || !cue || !obj) return;
    cancelAnimationFrame(raf.current);

    const pocketPos = POCKET_MAP[best.pocketId].pos;

    // the cue rests at the contact point (midpoint ghost↔object) so the
    // replay looks like a real hit, not a line floating short of the ball
    const contact: Vec = {
      x: (best.ghost.x + obj.pos.x) / 2,
      y: (best.ghost.y + obj.pos.y) / 2,
    };
    const cuePoints: Vec[] =
      kind === "best"
        ? [...best.cuePolyline, contact]
        : aimLine && verdict
          ? [cue.pos, {
              x: cue.pos.x + (aimLine.to.x - cue.pos.x),
              y: cue.pos.y + (aimLine.to.y - cue.pos.y),
            }]
          : best.cuePolyline;

    const cueDur = 1100;
    const objDur = 850;
    const t0 = performance.now();

    const step = (now: number) => {
      const el = now - t0;
      if (el < cueDur) {
        const p = pointAlong(cuePoints, el / cueDur);
        setReplay({ cue: p, object: null, phase: "cue" });
        raf.current = requestAnimationFrame(step);
        return;
      }
      const el2 = el - cueDur;
      if (el2 < objDur) {
        const f = el2 / objDur;
        setReplay({
          cue: kind === "best" ? contact : cuePoints[cuePoints.length - 1],
          object: {
            x: obj.pos.x + (pocketPos.x - obj.pos.x) * f,
            y: obj.pos.y + (pocketPos.y - obj.pos.y) * f,
          },
          phase: "object",
        });
        raf.current = requestAnimationFrame(step);
        return;
      }
      setReplay({ cue: cuePoints[cuePoints.length - 1], object: null, phase: "done" });
    };
    raf.current = requestAnimationFrame(step);
  }

  const diffTone = (d: number) =>
    d < 3 ? "text-primary" : d < 6 ? "text-gold" : "text-danger";

  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      {/* ── main column ─────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {/* header */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold">
              <Activity size={20} className="text-primary" />
              Escape Solver
            </h1>
            <p className="text-xs text-muted-foreground">
              Drag any ball · tap a ball to target it · drag the cue ball to draw your aim
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                cancelAnimationFrame(raf.current);
                setReplay(null);
                store.reset();
              }}
              className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <Link
              href="/practice"
              className="flex items-center gap-1.5 rounded-xl bg-primary/15 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
            >
              <Dices size={14} /> Practice
            </Link>
          </div>
        </header>

        {/* table */}
        <div className="glass overflow-hidden p-2 sm:p-3">
          <CoachTable aimLine={aimLine} replay={replay} onAim={setAimLine} />
        </div>

          {/* controls */}
          <div className="glass flex flex-col gap-4 p-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Target Ball */}
              <div className="flex items-center gap-2">
                <Target size={16} className="text-gold" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Target
                </span>
                <span
                  className="inline-block h-5 w-5 rounded-full border border-black/40"
                  style={{
                    background: obj ? BALL_COLORS[obj.color] : "#333",
                  }}
                />
                <span className="text-sm font-bold capitalize text-foreground">
                  {obj ? obj.color : "—"}
                </span>
                {obj && obj.color !== "cue" && (
                  <button
                    onClick={() => store.removeBall(obj.id)}
                    aria-label="Remove target ball"
                    className="rounded-lg bg-white/5 p-1.5 text-muted-foreground hover:bg-danger/20 hover:text-danger"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              {/* Mode: Hit vs Pot */}
              <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1">
                <button
                  onClick={() => store.setTargetMode("hit")}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                    store.targetMode === "hit"
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  แก้ให้โดนลูก
                </button>
                <button
                  onClick={() => store.setTargetMode("pot")}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                    store.targetMode === "pot"
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  แก้เพื่อลงหลุม
                </button>
              </div>

              {/* Grid Toggle */}
              <button
                onClick={() => store.toggleGrid()}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors",
                  store.showGrid
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
                )}
              >
                📐 เส้นแบ่งสัดส่วนโต๊ะ {store.showGrid ? "(เปิด)" : "(ปิด)"}
              </button>

              {/* Cushions slider */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cushions
                </span>
                <input
                  type="range"
                  min={0}
                  max={6}
                  step={1}
                  value={store.maxCushions}
                  onChange={(e) => store.setMaxCushions(Number(e.target.value))}
                  className="w-28 accent-[var(--color-primary)]"
                />
                <span className="w-6 text-sm font-bold text-primary">
                  {store.maxCushions}
                </span>
              </div>
            </div>

          {/* ball tray */}
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Add ball
            </span>
            {TRAY.map((c) => (
              <button
                key={c}
                onClick={() => store.addBall(c)}
                aria-label={`Add ${c}`}
                className="h-7 w-7 rounded-full border border-black/40 transition-transform hover:scale-110 active:scale-95"
                style={{
                  background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), ${
                    BALL_COLORS[c]
                  } 65%)`,
                }}
              />
            ))}
            <span className="ml-2 text-[10px] text-muted-foreground">
              {store.balls.length} balls on the cloth
            </span>
          </div>
        </div>

        {/* path list */}
        {store.solved && store.paths.length > 0 && (
          <div className="glass p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold">
                Routes to {pocket?.name}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({store.paths.length} found)
                </span>
              </h2>
              <button
                onClick={() => runReplay("best")}
                className="flex items-center gap-1.5 rounded-xl bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/25"
              >
                <Play size={13} /> Replay best
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {store.paths.slice(0, 12).map((p) => {
                const active = p.id === (best?.id ?? "");
                return (
                  <button
                    key={p.id}
                    onClick={() => store.selectPath(p.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition-colors",
                      active
                        ? "border-primary/40 bg-primary/10"
                        : "bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        p.cushions === 0
                          ? "bg-white/10 text-foreground"
                          : "bg-primary/20 text-primary"
                      )}
                    >
                      {p.cushions === 0
                        ? "Straight"
                        : p.sideSequence.join("·")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {p.cushions} cushion{p.cushions === 1 ? "" : "s"} ·{" "}
                      {Math.round(p.totalLength)}u
                    </span>
                    {p.blocked ? (
                      <span className="ml-auto text-[11px] font-semibold text-danger">
                        {p.blockReason ?? "blocked"}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "ml-auto text-sm font-bold",
                          diffTone(p.difficulty)
                        )}
                      >
                        {p.difficulty}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          /10
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
              {store.paths.length === 0 && (
                <div className="rounded-xl bg-danger/10 p-3 text-sm text-danger">
                  No route found within the cushion budget.
                </div>
              )}
            </div>
          </div>
        )}

        {/* shot analyzer */}
        <div className="glass p-4">
          <h2 className="text-sm font-bold">Shot Analyzer</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Drag the <span className="text-foreground">cue ball</span> to draw your aim
            line, then compare it against the engine&apos;s route.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {!verdict ? (
              <span className="text-xs text-muted-foreground">
                {aimLine ? "…" : "No aim line yet — drag the cue ball."}
              </span>
            ) : (
              <>
                <div className="rounded-xl bg-white/5 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Error angle
                  </div>
                  <div
                    className={cn(
                      "text-lg font-bold",
                      verdict.errorAngleDeg < 5
                        ? "text-primary"
                        : verdict.errorAngleDeg < 15
                          ? "text-gold"
                          : "text-danger"
                    )}
                  >
                    {verdict.errorAngleDeg}°
                  </div>
                </div>
                <div className="rounded-xl bg-white/5 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Contact offset
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {verdict.contactOffsetRadii > 0 ? "+" : ""}
                    {verdict.contactOffsetRadii}r
                  </div>
                </div>
                <div className="rounded-xl bg-white/5 px-3 py-2 text-xs leading-relaxed text-foreground/85">
                  {verdict.willContact ? verdict.verdict : "Your line misses the object ball entirely."}
                </div>
                <button
                  onClick={() => runReplay("mine")}
                  className="flex items-center gap-1.5 rounded-xl bg-info/20 px-3 py-2 text-xs font-bold text-info transition-colors hover:bg-info/30"
                >
                  <Play size={13} /> Replay my shot
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── right sidebar: AI coach ─────────────────────────────── */}
      <div className="w-full lg:w-80 lg:flex-shrink-0">
        <AiCoachPanel />
      </div>
    </div>
  );
}
