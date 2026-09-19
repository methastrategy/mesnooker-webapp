"use client";

import { ActionButton } from "@/components/ui";
import type { GameMode } from "@/types";

/** The three "how the round ended" scoring inputs — equal-size tactile keys,
 *  colored by context so their consequence is legible at a glance:
 *  Foul (red −4/−2) · Snooker miss (amber −2) · Solve (gold +1).
 *  Each, when pressed, will auto-advance the turn to the next player (wired in
 *  LiveMatch), so the operator never needs a separate "End turn" tap. */
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
  const foulValue = mode === "points" ? "-4" : "-2";
  const missValue = mode === "points" ? "-2" : "-1";
  return (
    <div className="grid grid-cols-3 gap-2">
      <ActionButton tone="danger" onClick={onFoul} aria-label={`Foul ${foulValue}`}>
        <span className="flex flex-col items-center leading-none">
          <span className="text-sm font-bold">Foul</span>
          <span className="mt-0.5 text-[11px] font-bold opacity-80 tabular-nums">{foulValue}</span>
        </span>
      </ActionButton>
      <ActionButton tone="violation" onClick={onMiss} aria-label={`Snooker miss ${missValue}`}>
        <span className="flex flex-col items-center leading-none">
          <span className="text-sm font-bold">Snooker miss</span>
          <span className="mt-0.5 text-[11px] font-bold opacity-80 tabular-nums">{missValue}</span>
        </span>
      </ActionButton>
      <ActionButton tone="gold" onClick={onSolve} aria-label="Solve snooker +1">
        <span className="flex flex-col items-center leading-none">
          <span className="text-sm font-bold">Solve</span>
          <span className="mt-0.5 text-[11px] font-bold opacity-80 tabular-nums">+1</span>
        </span>
      </ActionButton>
    </div>
  );
}