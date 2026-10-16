"use client";

import { AlertTriangle, CircleSlash, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { ActionButton } from "@/components/ui";
import type { GameMode } from "@/types";

/**
 * Tactical Action Keypad:
 * 1. Foul (−4/−2): Quick 1-tap standard foul, with dedicated options button for detailed ball fouls.
 * 2. Miss (−2/−1): Snooker miss penalty.
 * 3. Solve (+1): Always active & clickable at any time for escaping a snooker.
 * (Red ball pot is located on the main BallPad to prevent accidental duplicates).
 */
export function ViolationPanel({
  mode,
  onFoul,
  onMiss,
  onSolve,
  onOpenFoulOptions,
}: {
  mode: GameMode;
  onFoul: () => void;
  onMiss: () => void;
  onSolve: () => void;
  onOpenFoulOptions?: () => void;
}) {
  const foulValue = mode === "points" ? "−4" : "−2";
  const missValue = mode === "points" ? "−2" : "−1";

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 w-full select-none">
      {/* 1. Foul — Danger Red Keycap with Quick Tap & Option Trigger */}
      <div className="relative w-full">
        <ActionButton
          tone="danger"
          onClick={onFoul}
          aria-label={`Foul penalty ${foulValue} (Press F)`}
          className="flex-col gap-0.5 sm:gap-1 px-1 sm:px-3 py-1.5 h-13 min-[380px]:h-14 sm:h-14 md:h-16 w-full rounded-2xl bg-destructive/15 hover:bg-destructive/25 border-destructive/40 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1">
            <AlertTriangle size={16} className="text-destructive shrink-0" />
            <kbd className="hidden sm:inline-flex items-center justify-center text-[9px] font-mono px-1 py-0.5 rounded bg-black/40 text-foreground/70 border border-white/10 leading-none">
              F
            </kbd>
          </div>
          <div className="flex items-center gap-1 leading-none">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wide">Foul</span>
            <span className="font-mono text-[10px] sm:text-xs font-bold opacity-90">{foulValue}</span>
          </div>
        </ActionButton>

        {onOpenFoulOptions && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenFoulOptions();
            }}
            title="Foul options & Play Again"
            aria-label="Foul options & Play Again"
            className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 p-1 rounded-lg bg-black/50 hover:bg-black/80 border border-white/15 text-destructive hover:text-white transition-all z-10 cursor-pointer"
          >
            <SlidersHorizontal size={12} />
          </button>
        )}
      </div>

      {/* 2. Miss — Violation Amber Keycap */}
      <ActionButton
        tone="violation"
        onClick={onMiss}
        aria-label={`Snooker miss ${missValue} (Press M)`}
        className="flex-col gap-0.5 sm:gap-1 px-1 sm:px-3 py-1.5 h-13 min-[380px]:h-14 sm:h-14 md:h-16 w-full rounded-2xl bg-violation/15 hover:bg-violation/25 border-violation/40 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-1">
          <CircleSlash size={16} className="text-violation shrink-0" />
          <kbd className="hidden sm:inline-flex items-center justify-center text-[9px] font-mono px-1 py-0.5 rounded bg-black/40 text-foreground/70 border border-white/10 leading-none">
            M
          </kbd>
        </div>
        <div className="flex items-center gap-1 leading-none">
          <span className="text-xs sm:text-sm font-black uppercase tracking-wide">Miss</span>
          <span className="font-mono text-[10px] sm:text-xs font-bold opacity-90">{missValue}</span>
        </div>
      </ActionButton>

      {/* 3. Solve — Emerald / Gold Escape Keycap */}
      <ActionButton
        tone="gold"
        onClick={onSolve}
        aria-label="Solve snooker escape +1 (Press S)"
        className="flex-col gap-0.5 sm:gap-1 px-1 sm:px-3 py-1.5 h-13 min-[380px]:h-14 sm:h-14 md:h-16 w-full rounded-2xl bg-amber-500/20 text-amber-300 border-amber-400/50 hover:bg-amber-500/30 transition-all shadow-xs cursor-pointer"
      >
        <div className="flex items-center gap-1">
          <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
          <kbd className="hidden sm:inline-flex items-center justify-center text-[9px] font-mono px-1 py-0.5 rounded bg-black/40 text-foreground/70 border border-white/10 leading-none">
            S
          </kbd>
        </div>
        <div className="flex items-center gap-1 leading-none">
          <span className="text-xs sm:text-sm font-black uppercase tracking-wide">Solve</span>
          <span className="font-mono text-[10px] sm:text-xs font-black">+1</span>
        </div>
      </ActionButton>
    </div>
  );
}