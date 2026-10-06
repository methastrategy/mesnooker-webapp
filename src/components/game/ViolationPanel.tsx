"use client";

import { AlertTriangle, CircleSlash, CheckCircle2 } from "lucide-react";
import { ActionButton } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { GameMode } from "@/types";

/**
 * Tactical Action Keypad:
 * 1. Penalties Group (− points): Foul (−4/−2) & Miss (−2/−1) grouped side-by-side in capsule.
 * 2. Solve (+1): Always active & clickable at any time for escaping a snooker.
 * 3. Red Pot (+1): New dedicated keycap to pot a red ball (+1 pt).
 *    - Active & bright ONLY when legally allowed to pot a red (canPotRed).
 *    - Dimmed down (disabled) when shooting a colour or when no reds remain.
 */
export function ViolationPanel({
  mode,
  onFoul,
  onMiss,
  onSolve,
  onPotRed,
  canPotRed = true,
}: {
  mode: GameMode;
  onFoul: () => void;
  onMiss: () => void;
  onSolve: () => void;
  onPotRed?: () => void;
  canPotRed?: boolean;
}) {
  const foulValue = mode === "points" ? "−4" : "−2";
  const missValue = mode === "points" ? "−2" : "−1";

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 w-full select-none">
      {/* 1. Foul — Danger Red Keycap */}
      <ActionButton
        tone="danger"
        onClick={onFoul}
        aria-label={`Foul penalty ${foulValue}`}
        className="flex-col gap-0.5 sm:gap-1 px-1 sm:px-3 py-1.5 h-13 min-[380px]:h-14 sm:h-14 md:h-16 w-full rounded-2xl bg-destructive/15 hover:bg-destructive/25 border-destructive/40 transition-all"
      >
        <AlertTriangle size={17} className="text-destructive shrink-0" />
        <div className="flex items-center gap-1 leading-none">
          <span className="text-xs sm:text-sm font-black uppercase tracking-wide">Foul</span>
          <span className="font-mono text-[10px] sm:text-xs font-bold opacity-90">{foulValue}</span>
        </div>
      </ActionButton>

      {/* 2. Miss — Violation Amber Keycap */}
      <ActionButton
        tone="violation"
        onClick={onMiss}
        aria-label={`Snooker miss ${missValue}`}
        className="flex-col gap-0.5 sm:gap-1 px-1 sm:px-3 py-1.5 h-13 min-[380px]:h-14 sm:h-14 md:h-16 w-full rounded-2xl bg-violation/15 hover:bg-violation/25 border-violation/40 transition-all"
      >
        <CircleSlash size={17} className="text-violation shrink-0" />
        <div className="flex items-center gap-1 leading-none">
          <span className="text-xs sm:text-sm font-black uppercase tracking-wide">Miss</span>
          <span className="font-mono text-[10px] sm:text-xs font-bold opacity-90">{missValue}</span>
        </div>
      </ActionButton>

      {/* 3. Solve — Emerald / Gold Escape Keycap */}
      <ActionButton
        tone="gold"
        onClick={onSolve}
        aria-label="Solve snooker escape +1"
        className="flex-col gap-0.5 sm:gap-1 px-1 sm:px-3 py-1.5 h-13 min-[380px]:h-14 sm:h-14 md:h-16 w-full rounded-2xl bg-amber-500/20 text-amber-300 border-amber-400/50 hover:bg-amber-500/30 transition-all shadow-xs"
      >
        <CheckCircle2 size={17} className="text-amber-400 shrink-0" />
        <div className="flex items-center gap-1 leading-none">
          <span className="text-xs sm:text-sm font-black uppercase tracking-wide">Solve</span>
          <span className="font-mono text-[10px] sm:text-xs font-black">+1</span>
        </div>
      </ActionButton>

      {/* 4. Red Pot — Tactile Snooker Ball Keycap */}
      <ActionButton
        tone="danger"
        disabled={!canPotRed}
        onClick={onPotRed}
        aria-label="Pot red ball +1"
        className={cn(
          "flex-col gap-0.5 sm:gap-1 px-1 sm:px-3 py-1.5 h-13 min-[380px]:h-14 sm:h-14 md:h-16 w-full rounded-2xl transition-all",
          canPotRed
            ? "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 cursor-pointer shadow-xs"
            : "opacity-25 grayscale border-border/30 bg-surface/20 text-muted-foreground pointer-events-none cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "h-3.5 w-3.5 rounded-full shrink-0 transition-all",
            canPotRed ? "bg-red-500 shadow-xs border border-white/50" : "bg-muted-foreground/40"
          )}
        />
        <div className="flex items-center gap-1 leading-none">
          <span className="text-xs sm:text-sm font-black uppercase tracking-wide">Red</span>
          <span className="font-mono text-[10px] sm:text-xs font-black">+1</span>
        </div>
      </ActionButton>
    </div>
  );
}