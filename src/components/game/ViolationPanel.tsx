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
    <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap sm:flex-nowrap">
      {/* ─── 1. Penalties Capsule: Foul + Miss (− points) ─── */}
      <div className="flex items-center gap-1 rounded-[8px] border border-border/80 bg-surface/60 p-0.5">
        {/* Foul — red penalty */}
        <ActionButton
          tone="danger"
          onClick={onFoul}
          aria-label={`Foul penalty ${foulValue}`}
          className="flex-col gap-0.5 px-2 sm:px-2.5 py-1 h-12 min-w-[44px] sm:min-w-[52px]"
        >
          <AlertTriangle size={14} className="text-destructive shrink-0" />
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Foul</span>
            <span className="font-mono text-[9px] opacity-80">{foulValue}</span>
          </div>
        </ActionButton>

        {/* Miss — amber violation */}
        <ActionButton
          tone="violation"
          onClick={onMiss}
          aria-label={`Snooker miss ${missValue}`}
          className="flex-col gap-0.5 px-2 sm:px-2.5 py-1 h-12 min-w-[44px] sm:min-w-[52px]"
        >
          <CircleSlash size={14} className="text-violation shrink-0" />
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Miss</span>
            <span className="font-mono text-[9px] opacity-80">{missValue}</span>
          </div>
        </ActionButton>
      </div>

      {/* ─── 2. Positive Scoring Group (+ points): Solve & Red Pot ─── */}
      <div className="flex items-center gap-1 rounded-[8px] border border-border/80 bg-surface/60 p-0.5">
        {/* Solve (+1 pt) — Always enabled for snooker escape at any turn */}
        <ActionButton
          tone="gold"
          onClick={onSolve}
          aria-label="Solve snooker escape +1"
          className="flex-col gap-0.5 px-2 sm:px-2.5 py-1 h-12 min-w-[46px] sm:min-w-[54px] bg-gold/15 text-gold border-gold/40 border-t-white/20 hover:bg-gold/25"
        >
          <CheckCircle2 size={14} className="text-gold shrink-0" />
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Solve</span>
            <span className="font-mono text-[10px] font-bold">+1</span>
          </div>
        </ActionButton>

        {/* Red Pot (+1 pt) — Active ONLY when shooting red, dimmed on colour */}
        <ActionButton
          tone="danger"
          disabled={!canPotRed}
          onClick={onPotRed}
          aria-label="Pot red ball +1"
          className={cn(
            "flex-col gap-0.5 px-2 sm:px-2.5 py-1 h-12 min-w-[48px] sm:min-w-[56px] transition-all",
            canPotRed
              ? "bg-[#da2c38]/20 text-[#ff5c6a] border border-[#da2c38]/50 border-t-white/30 hover:bg-[#da2c38]/30 cursor-pointer shadow-xs"
              : "opacity-25 grayscale border-border/30 bg-surface/20 text-muted-foreground pointer-events-none cursor-not-allowed"
          )}
        >
          <span
            className={cn(
              "h-3 w-3 rounded-full shrink-0 transition-all",
              canPotRed ? "bg-[#da2c38] shadow-xs border border-white/30" : "bg-muted-foreground/40"
            )}
          />
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Red</span>
            <span className="font-mono text-[10px] font-bold">+1</span>
          </div>
        </ActionButton>
      </div>
    </div>
  );
}