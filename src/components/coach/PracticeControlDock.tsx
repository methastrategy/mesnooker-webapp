"use client";

import * as React from "react";
import {
  Compass,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useCoachStore } from "@/store/coachStore";
import { useGameStore } from "@/store/gameStore";
import { VerticalPowerSlider } from "./VerticalPowerSlider";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { SolvePath } from "@/lib/geometry";
import type { ShotOutcome } from "@/lib/physics";

const POWER_PRESETS = [
  { label: "เบา 25%", value: 25 },
  { label: "กลาง 50%", value: 50 },
  { label: "แรง 75%", value: 75 },
  { label: "เต็มแรง 100%", value: 100 },
];

export interface PracticeControlDockProps {
  shotOutcome: ShotOutcome | null;
  isSimulating: boolean;
  best: SolvePath | undefined;
  onStrike: () => void;
  onRetry: () => void;
  onAutoAimBlack: () => void;
}

export function PracticeControlDock({
  shotOutcome,
  isSimulating,
  best,
  onStrike,
  onRetry,
  onAutoAimBlack,
}: PracticeControlDockProps) {
  const aimAngleDeg = useCoachStore((s) => s.aimAngleDeg);
  const adjustAimAngle = useCoachStore((s) => s.adjustAimAngle);
  const syncAimFromSolver = useCoachStore((s) => s.syncAimFromSolver);
  const power = useCoachStore((s) => s.power);
  const setPower = useCoachStore((s) => s.setPower);
  const locale = useGameStore((s) => s.locale);

  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-4 border border-gold/20 shadow-xl bg-gradient-to-b from-white/[0.04] to-transparent">
      {/* Outcome Evaluation Toast / Banner */}
      {shotOutcome && (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 border transition-all",
            shotOutcome.success
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-danger/15 border-danger/30 text-danger"
          )}
        >
          <div className="flex items-center gap-2.5">
            {shotOutcome.success ? (
              <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle size={18} className="shrink-0 text-danger" />
            )}
            <div>
              <div className="text-xs font-bold">
                {shotOutcome.success
                  ? "🎉 แก้สนุ๊กสำเร็จ! ลูกขาวเข้ากระทบลูกดำสำเร็จ (Clean Escape Hit)"
                  : shotOutcome.foulReason || "แทงฟาวล์"}
              </div>
              <div className="text-[11px] opacity-80">
                ชิ่งก่อนกระทบ: {shotOutcome.cushionsBeforeHit} ครั้ง · รวมชิ่งทั้งสิ้น:{" "}
                {shotOutcome.totalCushionsHit} ครั้ง
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRetry}
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
                onClick={onAutoAimBlack}
                className="rounded-md bg-white/5 hover:bg-white/10 px-2 py-0.5 text-[11px] font-medium text-gold border border-gold/30 transition-colors"
                title="หันไม้คิวเล็งไปยังลูกดำโดยตรง"
              >
                {t("solve.autoAim", locale)}
              </button>
              {best && (
                <button
                  type="button"
                  onClick={syncAimFromSolver}
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
                onClick={() => adjustAimAngle(-1.0)}
                className="rounded-lg bg-white/5 hover:bg-white/15 px-2.5 py-1 text-xs font-mono font-bold text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                title="หมุนซ้าย -1.0°"
              >
                -1°
              </button>
              <button
                type="button"
                onClick={() => adjustAimAngle(-0.1)}
                className="rounded-lg bg-white/5 hover:bg-white/15 px-2 py-1 text-xs font-mono font-bold text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                title="หมุนละเอียดซ้าย -0.1°"
              >
                -0.1°
              </button>
            </div>

            <div className="text-center">
              <span className="font-mono text-base font-bold text-gold">
                {aimAngleDeg.toFixed(1)}°
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjustAimAngle(0.1)}
                className="rounded-lg bg-white/5 hover:bg-white/15 px-2 py-1 text-xs font-mono font-bold text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                title="หมุนละเอียดขวา +0.1°"
              >
                +0.1°
              </button>
              <button
                type="button"
                onClick={() => adjustAimAngle(1.0)}
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
            power={power}
            onChange={setPower}
            onReleaseStrike={onStrike}
            disabled={isSimulating}
          />

          <div className="flex flex-1 flex-col justify-between gap-2.5 h-full py-0.5">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Zap size={14} className="text-amber-400" />
                  {t("solve.powerSlider", locale)}:
                </span>
                <span className="font-mono text-sm font-bold text-gold">
                  {power}%
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
                  onClick={() => setPower(p.value)}
                  className={cn(
                    "rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all active:scale-95 text-center",
                    power === p.value
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
              onClick={onStrike}
              disabled={isSimulating}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold text-xs shadow-xl transition-all active:scale-95",
                isSimulating
                  ? "bg-muted text-muted-foreground cursor-not-allowed animate-pulse"
                  : "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/25 hover:brightness-110"
              )}
            >
              <Play size={14} fill="currentColor" />
              {isSimulating ? t("solve.strike.running", locale) : t("solve.strike", locale)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
