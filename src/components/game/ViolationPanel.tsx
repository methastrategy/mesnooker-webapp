"use client";

import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui";
import type { GameMode } from "@/types";

/** Segmented violation panel: consistent equal-size tiles with distinct
 *  semantic colors so Foul (red) vs Snooker-miss (amber) never conflate.
 *  Undo is a plain ghost on the far right (corrective, not a penalty). */
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
    <div className="flex items-center gap-2">
      <div className="grid flex-1 grid-cols-3 gap-2">
        <Button variant="danger" size="tile" onClick={onFoul} className="flex-col gap-0.5 leading-none h-14">
          <span className="text-[13px] font-bold">Foul</span>
          <span className="text-[10px] opacity-80 tabular-nums">{foulValue}</span>
        </Button>
        <Button variant="violation" size="tile" onClick={onMiss} className="flex-col gap-0.5 leading-none h-14">
          <span className="text-[13px] font-bold leading-tight">Snooker<br />miss</span>
          <span className="text-[10px] opacity-80 tabular-nums">-2</span>
        </Button>
        <Button variant="gold" size="tile" onClick={onSolve} className="flex-col gap-0.5 leading-none h-14">
          <span className="text-[13px] font-bold">Solve</span>
          <span className="text-[10px] opacity-80 tabular-nums">+1</span>
        </Button>
      </div>
      <Button
        variant="ghost"
        size="tile"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo last action"
        title="Undo last action"
        className="h-14 w-12 shrink-0"
      >
        <Undo2 size={18} />
      </Button>
    </div>
  );
}