"use client";

import { ActionButton } from "@/components/ui";
import type { GameMode } from "@/types";

/** The three "how the round ended" scoring inputs — equal-size tactile keys,
 *  colored by context so their consequence is legible at a glance:
 *  🚫 Foul (red −4/−2) · ❌ Snooker miss (amber −2/−1) · ✅ Solve (gold +1).
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
  const foulValue = mode === "points" ? "−4" : "−2";
  const missValue = mode === "points" ? "−2" : "−1";

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Foul — red, most serious penalty */}
      <ActionButton
        tone="danger"
        onClick={onFoul}
        aria-label={`Foul penalty ${foulValue}`}
        className="flex-col gap-0.5"
      >
        <span className="text-base leading-none">🚫</span>
        <span className="text-[11px] font-bold leading-none uppercase tracking-wide">Foul</span>
        <span className="mt-0.5 rounded-full bg-black/30 px-1.5 py-0 text-[10px] font-bold tabular-nums leading-snug">
          {foulValue}
        </span>
      </ActionButton>

      {/* Snooker miss — amber, shoot the snook but miss */}
      <ActionButton
        tone="violation"
        onClick={onMiss}
        aria-label={`Snooker miss ${missValue}`}
        className="flex-col gap-0.5"
      >
        <span className="text-base leading-none">❌</span>
        <span className="text-[11px] font-bold leading-none uppercase tracking-wide">Miss</span>
        <span className="mt-0.5 rounded-full bg-black/30 px-1.5 py-0 text-[10px] font-bold tabular-nums leading-snug">
          {missValue}
        </span>
      </ActionButton>

      {/* Solve — gold, successfully escapes a snooker */}
      <ActionButton
        tone="gold"
        onClick={onSolve}
        aria-label="Solve snooker +1"
        className="flex-col gap-0.5"
      >
        <span className="text-base leading-none">✅</span>
        <span className="text-[11px] font-bold leading-none uppercase tracking-wide">Solve</span>
        <span className="mt-0.5 rounded-full bg-black/30 px-1.5 py-0 text-[10px] font-bold tabular-nums leading-snug">
          +1
        </span>
      </ActionButton>
    </div>
  );
}