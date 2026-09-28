"use client";

import { AlertTriangle, CircleSlash, CheckCircle2 } from "lucide-react";
import { ActionButton } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { GameMode } from "@/types";

/**
 * Violation & Solve Controls:
 * 1. Penalties Group: Foul & Miss grouped together with negative point badges (−4/−2 or −2/−1).
 * 2. Solve (+1): Active & bright ONLY when legal to pot a red ball, dimmed down when on color.
 */
export function ViolationPanel({
  mode,
  onFoul,
  onMiss,
  onSolve,
  canSolve = true,
}: {
  mode: GameMode;
  onFoul: () => void;
  onMiss: () => void;
  onSolve: () => void;
  canSolve?: boolean;
}) {
  const foulValue = mode === "points" ? "−4" : "−2";
  const missValue = mode === "points" ? "−2" : "−1";

  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      {/* ─── Penalties Capsule: Foul + Miss (− points) ─── */}
      <div className="flex items-center gap-1 rounded-[8px] border border-border/80 bg-surface/60 p-0.5">
        {/* Foul — red, penalty */}
        <ActionButton
          tone="danger"
          onClick={onFoul}
          aria-label={`Foul penalty ${foulValue}`}
          className="flex-col gap-0.5 px-2 sm:px-3 py-1 h-12 min-w-[46px] sm:min-w-[56px]"
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
          className="flex-col gap-0.5 px-2 sm:px-3 py-1 h-12 min-w-[46px] sm:min-w-[56px]"
        >
          <CircleSlash size={14} className="text-violation shrink-0" />
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Miss</span>
            <span className="font-mono text-[9px] opacity-80">{missValue}</span>
          </div>
        </ActionButton>
      </div>

      {/* ─── Solve (+1 pt) — Active only on red, dimmed on colour ─── */}
      <ActionButton
        tone="primary"
        disabled={!canSolve}
        onClick={onSolve}
        aria-label="Solve snooker +1"
        className={cn(
          "flex-col gap-0.5 px-2 sm:px-3 py-1 h-12 min-w-[50px] sm:min-w-[62px] transition-all",
          canSolve
            ? "bg-primary/20 text-primary border border-primary/45 border-t-white/20 hover:bg-primary/25 cursor-pointer shadow-xs"
            : "opacity-25 grayscale border-border/30 bg-surface/20 text-muted-foreground pointer-events-none cursor-not-allowed"
        )}
      >
        <CheckCircle2 size={14} className={canSolve ? "text-primary shrink-0" : "text-muted-foreground shrink-0"} />
        <div className="flex items-center gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider">Solve</span>
          <span className="font-mono text-[10px] font-bold">+1</span>
        </div>
      </ActionButton>
    </div>
  );
}