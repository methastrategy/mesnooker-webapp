"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Play,
  RotateCcw,
  Target,
  Plus,
  Trash2,
} from "lucide-react";
import { useCoachStore } from "@/store/coachStore";
import { BALL_COLORS, coachBrief, sideName } from "@/lib/geometry";
import { CoachTable, type ReplayState } from "@/components/coach/CoachTable";
import { cn } from "@/lib/utils";
import type { SolvePath, Vec, BallColor } from "@/lib/geometry";

const TRAY: BallColor[] = ["red", "yellow", "green", "brown", "blue", "pink", "black"];

export default function SolvePage() {
  const store = useCoachStore();
  const [replay, setReplay] = useState<ReplayState | null>(null);
  const raf = useRef(0);

  const cue = store.balls.find((b) => b.color === "cue");
  const obj = store.balls.find((b) => b.id === store.objectId);
  const best: SolvePath | undefined =
    store.paths.find((p) => p.id === store.selectedPathId) ??
    store.paths.find((p) => !p.blocked) ??
    store.paths[0];

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // Solve on initial load or ball move
  useEffect(() => {
    store.solve();
  }, []);

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

    const targetEnd = best.objectPolyline[1] ?? {
      x: obj.pos.x + 80 * ((obj.pos.x - best.ghost.x) / (Math.hypot(obj.pos.x - best.ghost.x, obj.pos.y - best.ghost.y) || 1)),
      y: obj.pos.y + 80 * ((obj.pos.y - best.ghost.y) / (Math.hypot(obj.pos.x - best.ghost.x, obj.pos.y - best.ghost.y) || 1)),
    };

    const step = (now: number) => {
      const el = now - t0;
      if (el < cueDur) {
        // Cue ball roll with natural rolling progress
        const linearT = el / cueDur;
        // Natural rolling ease: slightly faster at start, smooth roll
        const easeT = Math.sin((linearT * Math.PI) / 2);
        const p = pointAlong(cuePoints, easeT);
        setReplay({ cue: p, object: null, phase: "cue" });
        raf.current = requestAnimationFrame(step);
        return;
      }
      const el2 = el - cueDur;
      if (el2 < objDur) {
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
            <h1 className="flex items-center gap-2 text-xl font-bold">
              <Activity size={22} className="text-primary" />
              จำลองแก้สนุ๊ก ( snook slove simulator ,SSS )
            </h1>
            <p className="text-xs text-muted-foreground">
              ลากขยับลูกขาว ลูกเป้า หรือลูกบังบนโต๊ะเพื่อจำลองสถานการณ์ — ระบบจะคำนวณเส้นทางแทงแก้ชิ่งให้อัตโนมัติ
            </p>
          </div>
          <div className="flex items-center gap-2">
            {best && !best.blocked && (
              <button
                onClick={runReplay}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
              >
                <Play size={14} fill="currentColor" /> จำลองการแทง (Replay)
              </button>
            )}
            <button
              onClick={() => {
                cancelAnimationFrame(raf.current);
                setReplay(null);
                store.reset();
              }}
              className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground active:scale-95"
            >
              <RotateCcw size={14} /> รีเซ็ตตำแหน่ง
            </button>
          </div>
        </header>

        {/* Clean Snooker Table */}
        <div className="glass overflow-hidden rounded-2xl p-2 sm:p-3">
          <CoachTable aimLine={null} replay={replay} />
        </div>

        {/* Clean Controls Toolbar */}
        <div className="glass flex flex-col gap-3 rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Target ball indicator & selection */}
            <div className="flex items-center gap-2">
              <Target size={16} className="text-gold" />
              <span className="text-xs font-semibold text-muted-foreground">
                ลูกเป้าหมาย:
              </span>
              <span
                className="inline-block h-5 w-5 rounded-full border border-black/40 shadow-sm"
                style={{
                  background: obj ? BALL_COLORS[obj.color] : "#333",
                }}
              />
              <span className="text-sm font-bold capitalize text-foreground">
                {obj ? obj.color : "—"}
              </span>
              {obj && obj.color !== "cue" && store.balls.length > 2 && (
                <button
                  onClick={() => store.removeBall(obj.id)}
                  aria-label="Remove target ball"
                  title="ลบลูกเป้าหมาย"
                  className="ml-1 rounded-lg bg-white/5 p-1 text-muted-foreground hover:bg-danger/20 hover:text-danger"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                ลูกบนโต๊ะ {store.balls.length} ลูก
              </span>
            </div>
          </div>

          {/* Add Ball Tray */}
          <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
            <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <Plus size={13} /> เพิ่มลูกขวางทางสนู๊ก:
            </span>
            {TRAY.map((c) => (
              <button
                key={c}
                onClick={() => store.addBall(c)}
                aria-label={`Add ${c}`}
                title={`เพิ่มลูกสี ${c}`}
                className="h-7 w-7 rounded-full border border-black/40 shadow transition-transform hover:scale-110 active:scale-95"
                style={{
                  background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.65), ${
                    BALL_COLORS[c]
                  } 65%)`,
                }}
              />
            ))}
            <span className="ml-auto text-[11px] text-muted-foreground">
              ลูกบนโต๊ะ {store.balls.length} ลูก
            </span>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Clean AI Escape Guide */}
      <div className="w-full lg:w-80 lg:shrink-0">
        <aside className="glass flex flex-col gap-4 rounded-2xl p-4 lg:sticky lg:top-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">คำแนะนำการแทงแก้ชิ่ง</h2>
              <p className="text-[11px] text-muted-foreground">วิเคราะห์เส้นทางที่ดีที่สุด</p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                store.solved && best && !best.blocked
                  ? "bg-primary/20 text-primary"
                  : "bg-danger/20 text-danger"
              )}
            >
              {store.solved && best && !best.blocked ? "พบเส้นทางแก้" : "ไม่มีทางแก้"}
            </span>
          </div>

          {!best || best.blocked || !brief ? (
            <div className="rounded-xl bg-white/5 p-4 text-xs leading-relaxed text-muted-foreground">
              <p className="font-semibold text-danger">
                ⚠ โดนบังมิดทุกมุม หรือไม่มีเส้นทางชิ่งแก้ในจำนวนชิ่งที่กำหนด
              </p>
              <p className="mt-2">
                ลองขยับลูกขวาง หรือเพิ่มจำนวนชิ่งสูงสุดเป็น 3-4 ชิ่ง
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Summary Card */}
              <div className="rounded-xl bg-primary/10 p-3.5 border border-primary/20">
                <div className="text-[11px] uppercase tracking-wider text-primary font-bold">
                  วิธีแทงแก้ที่แนะนำ
                </div>
                <div className="mt-1 text-base font-bold text-foreground">
                  {best.cushions === 0
                    ? "แทงตรง (ไม่ชิ่ง)"
                    : `ชิ่ง ${best.cushions} ครั้ง (${best.sideSequence.map(s => sideName(s)).join(" ➔ ")})`}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  ระดับความยาก:{" "}
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
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  จุดเล็งเป้าหมาย (Aim Point)
                </div>
                <div className="mt-1 text-sm font-bold text-gold">
                  {brief.aimAngleDeg}° จากขอบชิ่งยาว
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {best.cushionNotes.length > 0
                    ? `กระทบชิ่งแรก: ชิ่ง${sideName(best.cushionNotes[0].side)} ที่ตำแหน่งประมาณ ${Math.round(
                        ((best.cushionNotes[0].side === "l" || best.cushionNotes[0].side === "r")
                          ? best.cushionNotes[0].point.y / 600
                          : best.cushionNotes[0].point.x / 1200
                        ) * 100
                      )}% ของความยาวชิ่ง`
                    : "เล็งตรงไปยังจุดกลางลูกเป้าหมาย"}
                </div>
              </div>

              {/* Hit Thickness */}
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  ความหนาในการสัมผัสลูกเป้า
                </div>
                <div className="mt-1 text-sm font-bold text-primary">
                  {brief.thicknessLabel}
                </div>
              </div>

              {/* Power Suggestion */}
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  น้ำหนักแรงแทง
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
