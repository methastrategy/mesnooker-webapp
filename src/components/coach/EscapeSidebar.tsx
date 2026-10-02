"use client";

import * as React from "react";
import { Compass, Lightbulb, Sparkles } from "lucide-react";
import { useCoachStore } from "@/store/coachStore";
import { useGameStore } from "@/store/gameStore";
import { CueTipPicker } from "./CueTipPicker";
import { sideName, type SolvePath, type coachBrief } from "@/lib/geometry";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { TrajectoryPreview } from "@/lib/physics";

export interface EscapeSidebarProps {
  best: SolvePath | undefined;
  brief: ReturnType<typeof coachBrief> | null;
  trajectoryPreview: TrajectoryPreview | null;
}

export function EscapeSidebar({
  best,
  brief,
  trajectoryPreview,
}: EscapeSidebarProps) {
  const mode = useCoachStore((s) => s.mode);
  const solved = useCoachStore((s) => s.solved);
  const locale = useGameStore((s) => s.locale);

  return (
    <div className="w-full lg:w-84 lg:shrink-0">
      <aside className="rounded-[10px] border border-border bg-card flex flex-col gap-4 p-4 lg:sticky lg:top-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {mode === "practice" ? "ข้อมูลและจุดแทงลูก" : t("solve.advice.title", locale)}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {mode === "practice" ? "ตั้งไซด์/สกรู และวิเคราะห์หน้าไม้" : t("solve.advice.subtitle", locale)}
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              mode === "practice"
                ? "bg-gold/20 text-gold"
                : solved && best && !best.blocked
                ? "bg-primary/20 text-primary"
                : "bg-danger/20 text-danger"
            )}
          >
            {mode === "practice"
              ? "ซ้อมแทงเอง"
              : solved && best && !best.blocked
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
        {mode === "practice" ? (
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
                        ? `โดนลูก${trajectoryPreview.firstHitBall.color.toUpperCase()} (ขวาง)`
                        : "ไม่โดนลูกใด"
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
  );
}
