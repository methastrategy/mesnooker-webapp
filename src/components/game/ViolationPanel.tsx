"use client";

import { AlertTriangle, CircleSlash, CheckCircle2 } from "lucide-react";
import { ActionButton } from "@/components/ui";
import type { GameMode } from "@/types";

/**
 * Linear-grade violation controls: Foul, Miss, Solve.
 */
export function ViolationPanel({
  mode,
  onFoul,
  onMiss,
  onSolve,
}: {
  mode: GameMode;
  onFoul: () => void;
  onMiss: () => void;
  onSolve: () => void;
}) {
  const foulValue = mode === "points" ? "−4" : "−2";
  const missValue = mode === "points" ? "−2" : "−1";

  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-1.5 md:gap-2">
      {/* Foul — red, most serious penalty */}
      <ActionButton
        tone="danger"
        onClick={onFoul}
        aria-label={`Foul penalty ${foulValue}`}
        className="flex-col gap-1 px-2 sm:px-3.5 py-1.5 h-auto min-h-12"
      >
        <AlertTriangle size={15} className="text-destructive" />
        <div className="flex items-center gap-0.5 sm:gap-1">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Foul</span>
          <span className="font-mono text-[10px] opacity-80">{foulValue}</span>
        </div>
      </ActionButton>

      {/* Snooker miss — amber, shoot the snook but miss */}
      <ActionButton
        tone="violation"
        onClick={onMiss}
        aria-label={`Snooker miss ${missValue}`}
        className="flex-col gap-1 px-2 sm:px-3.5 py-1.5 h-auto min-h-12"
      >
        <CircleSlash size={15} className="text-violation" />
        <div className="flex items-center gap-0.5 sm:gap-1">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Miss</span>
          <span className="font-mono text-[10px] opacity-80">{missValue}</span>
        </div>
      </ActionButton>

      {/* Solve — gold/green, successfully escapes a snooker */}
      <ActionButton
        tone="gold"
        onClick={onSolve}
        aria-label="Solve snooker +1"
        className="flex-col gap-1 px-2 sm:px-3.5 py-1.5 h-auto min-h-12"
      >
        <CheckCircle2 size={15} className="text-primary-foreground" />
        <div className="flex items-center gap-0.5 sm:gap-1">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Solve</span>
          <span className="font-mono text-[10px] font-bold">+1</span>
        </div>
      </ActionButton>
    </div>
  );
}