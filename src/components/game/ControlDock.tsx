"use client";

import { ArrowRight, Flag } from "lucide-react";
import { ActionButton } from "@/components/ui";
import { ViolationPanel } from "@/components/game/ViolationPanel";
import { MoreActionsSheet } from "@/components/game/MoreActionsSheet";
import type { GameMode } from "@/types";

/** The table-side control deck — the three round-ending keys, End turn, the
 *  ⋯ More popup (Undo/Redo) and the staged End frame, grouped into one
 *  physical dock anchored to the bottom of the screen during play:
 *    · Mobile (<lg): a thumb-reach dock fixed to the bottom of the viewport
 *      (above the safe area), so the scorer never has to hunt for keys.
 *    · Desktop (≥lg): the same deck sits in-flow at the end of the action
 *      column, directly under the baize — it reads like the rail of the table.
 *  All handlers are wired by LiveMatch — this file only arranges the chrome. */
export function ControlDock({
  mode,
  onFoul,
  onMiss,
  onSolve,
  onEndTurn,
  moreOpen,
  onMoreOpen,
  onMoreClose,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onEndFrame,
}: {
  mode: GameMode;
  onFoul: () => void;
  onMiss: () => void;
  onSolve: () => void;
  onEndTurn: () => void;
  moreOpen: boolean;
  onMoreOpen: () => void;
  onMoreClose: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onEndFrame: () => void;
}) {
  return (
    <div className="control-dock">
      <div className="flex items-center gap-1.5">
        <ViolationPanel mode={mode} onFoul={onFoul} onMiss={onMiss} onSolve={onSolve} />
        <div className="mx-1 h-10 w-px shrink-0 bg-white/10" />
        <ActionButton tone="primary" onClick={onEndTurn} className="h-14 min-w-16 shrink-0 px-3" aria-label="End turn">
          <ArrowRight size={20} />
          <span className="text-sm font-bold leading-none">Turn</span>
        </ActionButton>
        <ActionButton
          tone="outline"
          onClick={onMoreOpen}
          aria-label="More actions"
          title="More actions"
          className="h-14 w-12 shrink-0 px-0"
        >
          <span className="text-lg font-bold leading-none">⋯</span>
        </ActionButton>
      </div>
      {/* End frame deliberately quiet, below the deck — a mistake needs a
          second look. Reachable without opening the popup. */}
      <div className="flex justify-center pt-0.5">
        <ActionButton
          tone="outline"
          onClick={onEndFrame}
          aria-label="End frame"
          className="h-10 w-auto min-w-0 px-3 text-destructive shadow-none"
        >
          <Flag size={15} /> End frame
        </ActionButton>
      </div>
      <MoreActionsSheet
        open={moreOpen}
        onClose={onMoreClose}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
      />
    </div>
  );
}