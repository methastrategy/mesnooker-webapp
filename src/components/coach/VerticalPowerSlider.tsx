"use client";

import * as React from "react";
import { useRef, useState } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VerticalPowerSliderProps {
  power: number;
  onChange: (p: number) => void;
  onReleaseStrike: () => void;
  disabled: boolean;
}

/**
 * 8 Ball Pool Style Vertical Pull-Back Power Slider (0–100%)
 * Pull down on cue stick to charge power; release to strike immediately.
 */
export function VerticalPowerSlider({
  power,
  onChange,
  onReleaseStrike,
  disabled,
}: VerticalPowerSliderProps) {
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
