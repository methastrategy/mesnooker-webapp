"use client";

import React, { useRef, useCallback } from "react";
import { useCoachStore, type CueSpin } from "@/store/coachStore";
import { cn } from "@/lib/utils";

interface Preset {
  id: string;
  label: string;
  thaiLabel: string;
  side: number;
  vertical: number;
  colorClass: string;
  style?: React.CSSProperties;
}

const PRESETS: Preset[] = [
  {
    id: "High",
    label: "High",
    thaiLabel: "ตามน้ำ (Topspin)",
    side: 0,
    vertical: 0.8,
    colorClass: "from-sky-500 to-blue-600",
  },
  {
    id: "HL",
    label: "HL",
    thaiLabel: "ไซด์บนซ้าย (High-Left)",
    side: -0.6,
    vertical: 0.6,
    colorClass: "from-teal-400 to-cyan-600",
  },
  {
    id: "HR",
    label: "HR",
    thaiLabel: "ไซด์บนขวา (High-Right)",
    side: 0.6,
    vertical: 0.6,
    colorClass: "from-blue-500 to-indigo-600",
  },
  {
    id: "Left",
    label: "Left",
    thaiLabel: "ไซด์ซ้าย (Left Side)",
    side: -0.8,
    vertical: 0,
    colorClass: "from-cyan-500 to-blue-600",
  },
  {
    id: "Right",
    label: "Right",
    thaiLabel: "ไซด์ขวา (Right Side)",
    side: 0.8,
    vertical: 0,
    colorClass: "from-blue-600 to-indigo-700",
  },
  {
    id: "LL",
    label: "LL",
    thaiLabel: "สกรูซ้าย (Low-Left)",
    side: -0.6,
    vertical: -0.6,
    colorClass: "from-sky-700 to-blue-900",
  },
  {
    id: "Low",
    label: "Low",
    thaiLabel: "สกรูถอยหลัง (Screw/Draw)",
    side: 0,
    vertical: -0.8,
    colorClass: "from-teal-600 to-cyan-800",
  },
  {
    id: "LR",
    label: "LR",
    thaiLabel: "สกรูขวา (Low-Right)",
    side: 0.6,
    vertical: -0.6,
    colorClass: "from-blue-700 to-indigo-900",
  },
];

export function CueTipPicker({
  recommendedId = "Center",
  className,
}: {
  recommendedId?: string;
  className?: string;
}) {
  const spin = useCoachStore((s) => s.spin);
  const setSpin = useCoachStore((s) => s.setSpin);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Determine active preset (if within tolerance)
  const activePreset =
    Math.hypot(spin.side, spin.vertical) < 0.25
      ? "Center"
      : PRESETS.find(
          (p) =>
            Math.hypot(p.side - spin.side, p.vertical - spin.vertical) < 0.35
        )?.id ?? null;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const radius = rect.width / 2;

      const updateFromPointer = (clientX: number, clientY: number) => {
        const dx = (clientX - cx) / radius;
        // Invert Y so up is positive (High) and down is negative (Low)
        const dy = -(clientY - cy) / radius;
        const len = Math.hypot(dx, dy);
        const maxLen = 0.88;
        const clampedLen = Math.min(len, maxLen);
        const factor = len > 0 ? clampedLen / len : 0;
        setSpin({
          side: Math.round(dx * factor * 100) / 100,
          vertical: Math.round(dy * factor * 100) / 100,
        });
      };

      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      updateFromPointer(e.clientX, e.clientY);

      const onPointerMove = (ev: PointerEvent) => {
        updateFromPointer(ev.clientX, ev.clientY);
      };
      const onPointerUp = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [setSpin]
  );

  const selectPreset = (preset: Preset | "Center") => {
    if (preset === "Center") {
      setSpin({ side: 0, vertical: 0 });
    } else {
      setSpin({ side: preset.side, vertical: preset.vertical });
    }
  };

  // Convert spin coordinates (-1 to 1) to percentage inside the ball (0% to 100%)
  const chalkX = 50 + spin.side * 42;
  const chalkY = 50 - spin.vertical * 42;

  return (
    <div className={cn("flex flex-col items-center gap-3 select-none", className)}>
      {/* Interactive Cue Ball Sphere Widget */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        className="relative flex h-52 w-52 sm:h-56 sm:w-56 cursor-crosshair items-center justify-center rounded-full border-2 border-white/20 shadow-2xl transition-transform"
        style={{
          background:
            "radial-gradient(circle at 35% 28%, #ffffff 0%, #e6edf5 55%, #b3c5db 85%, #8ba3c7 100%)",
          boxShadow:
            "0 15px 35px rgba(0,0,0,0.5), inset 0 2px 5px rgba(255,255,255,0.9), inset 0 -8px 16px rgba(0,0,0,0.25)",
        }}
        title="คลิกหรือลากจุดบนลูกขาวเพื่อปรับจุดแทงสกรู / ไซด์"
      >
        {/* Outer Circular Perimeter Guideline Ring */}
        <div className="pointer-events-none absolute h-[76%] w-[76%] rounded-full border border-sky-400/60 opacity-80" />

        {/* Center Target Preset Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            selectPreset("Center");
          }}
          className={cn(
            "group z-10 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 text-[11px] font-bold text-white shadow-md transition-all active:scale-90 hover:scale-105",
            activePreset === "Center"
              ? "ring-4 ring-emerald-300 ring-offset-2 ring-offset-white shadow-emerald-500/40"
              : "opacity-95 hover:opacity-100",
            recommendedId === "Center" && "animate-pulse ring-2 ring-amber-400"
          )}
          title="Center: แทงกลางลูก (ธรรมชาติ ไม่ใส่ไซด์)"
        >
          Center
        </button>

        {/* 8 Preset Buttons along the ring */}
        {PRESETS.map((p) => {
          // Calculate polar position on the ring (approx 38% radius from center)
          // angle in radians:
          const angle = Math.atan2(p.vertical, p.side);
          const rPct = 37.5; // percentage of widget radius
          const leftPct = 50 + Math.cos(angle) * rPct;
          const topPct = 50 - Math.sin(angle) * rPct;

          const isActive = activePreset === p.id;
          const isRec = recommendedId === p.id;

          return (
            <button
              key={p.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                selectPreset(p);
              }}
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                transform: "translate(-50%, -50%)",
              }}
              className={cn(
                "absolute z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white shadow-md transition-all active:scale-90 hover:scale-110",
                p.colorClass,
                isActive
                  ? "ring-2 ring-white ring-offset-1 ring-offset-sky-700 shadow-sky-500/50 scale-105"
                  : "opacity-90 hover:opacity-100",
                isRec && !isActive && "ring-2 ring-amber-400 ring-offset-1 ring-offset-black"
              )}
              title={`${p.label}: ${p.thaiLabel}`}
            >
              {p.label}
            </button>
          );
        })}

        {/* Draggable Chalk Strike Dot Indicator */}
        <div
          className="pointer-events-none absolute z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red-600 shadow-md shadow-red-600/80"
          style={{
            left: `${chalkX}%`,
            top: `${chalkY}%`,
          }}
        >
          <div className="h-full w-full rounded-full bg-red-500 animate-ping opacity-30" />
        </div>
      </div>

      {/* Active Cue Strike Status Indicator */}
      <div className="flex flex-col items-center text-center">
        <div className="text-xs font-bold text-foreground">
          {activePreset === "Center"
            ? "จุดแทง: กลางลูก (Center Ball)"
            : activePreset
            ? `จุดแทง: ${PRESETS.find((p) => p.id === activePreset)?.thaiLabel || activePreset}`
            : `จุดแทงอิสระ (Side: ${spin.side > 0 ? "+" : ""}${Math.round(spin.side * 100)}%, Vertical: ${spin.vertical > 0 ? "+" : ""}${Math.round(spin.vertical * 100)}%)`}
        </div>
        <p className="text-[11px] text-muted-foreground">
          กดปุ่มทิศทางหรือแตะลากจุดสีแดงบนลูกขาวเพื่อปรับไซด์/สกรู
        </p>
      </div>
    </div>
  );
}
