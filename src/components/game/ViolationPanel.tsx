"use client";

import { Undo2 } from "lucide-react";
import { ActionButton } from "@/components/ui";
import type { GameMode } from "@/types";

/** Segmented violation panel — all tiles are the same tactile `ActionButton`
 *  keycap family, differentiated only by semantic tone (not size/shape):
 *  Foul (red) · Snooker miss (amber) · Solve (gold) · Undo (flat outline). */
export function ViolationPanel({
  mode,
  onFoul,
  onMiss,
  onSolve,
  onUndo,
  canUndo,
}: {
  mode: GameMode;
  onFoul: () => void;
  onMiss: () => void;
  onSolve: () => void;
  onUndo: () => void;
  canUndo: boolean;
}) {
  const foulValue = mode === "points" ? "-4" : "-2";
  return (
    <div className="flex items-stretch gap-2">
      <div className="grid flex-1 grid-cols-3 gap-2">
        <ActionButton tone="danger" onClick={onFoul} aria-label={`Foul ${foulValue}`}>
          <span className="flex flex-col items-center leading-none">
            <span className="text-sm font-bold">Foul</span>
            <span className="mt-0.5 text-[11px] font-bold opacity-80 tabular-nums">{foulValue}</span>
          </span>
        </ActionButton>
        <ActionButton tone="violation" onClick={onMiss} aria-label="Snooker miss -2">
          <span className="flex flex-col items-center leading-none">
            <span className="text-sm font-bold">Snooker miss</span>
            <span className="mt-0.5 text-[11px] font-bold opacity-80 tabular-nums">-2</span>
          </span>
        </ActionButton>
        <ActionButton tone="gold" onClick={onSolve} aria-label="Solve snooker +1">
          <span className="flex flex-col items-center leading-none">
            <span className="text-sm font-bold">Solve</span>
            <span className="mt-0.5 text-[11px] font-bold opacity-80 tabular-nums">+1</span>
          </span>
        </ActionButton>
      </div>
      <ActionButton
        tone="outline"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo last action"
        title="Undo last action"
        className="w-14 shrink-0 px-0"
      >
        <Undo2 size={18} />
      </ActionButton>
    </div>
  );
}