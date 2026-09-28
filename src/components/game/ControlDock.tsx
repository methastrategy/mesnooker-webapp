"use client";

import { ArrowRight, Flag } from "lucide-react";
import { ActionButton } from "@/components/ui";
import { ViolationPanel } from "@/components/game/ViolationPanel";
import { MoreActionsSheet } from "@/components/game/MoreActionsSheet";
import type { GameMode } from "@/types";

/**
 * ControlDock — Raycast Ergonomic Command Deck:
 * 1. Penalties Group: Foul (−4/−2) & Miss (−2/−1) grouped side-by-side in capsule.
 * 2. Solve (+1): Active & bright ONLY when on red, dimmed when on color.
 * 3. Next Turn: Dominant primary action button (full 48px height, high-contrast green).
 * 4. More (⋯): Undo/Redo quick sheet.
 * 5. End Frame: Ergonomically separated below the deck with distinct compact footprint (28px height, muted) to prevent accidental mis-taps.
 */
export function ControlDock({
  mode,
  onFoul,
  onMiss,
  onSolve,
  canSolve = true,
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
  canSolve?: boolean;
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
      {/* Primary Dock Bar */}
      <div className="flex w-full max-w-lg items-center justify-between gap-1 sm:gap-1.5">
        {/* Penalties Group + Solve Button */}
        <ViolationPanel
          mode={mode}
          onFoul={onFoul}
          onMiss={onMiss}
          onSolve={onSolve}
          canSolve={canSolve}
        />

        <div className="mx-0.5 sm:mx-1 h-8 w-px shrink-0 bg-border/80" />

        {/* Turn & More Group */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <ActionButton
            tone="primary"
            onClick={onEndTurn}
            className="h-12 min-w-[72px] sm:min-w-[88px] px-3 sm:px-4 gap-1.5 shadow-xs"
            aria-label="End turn"
          >
            <span className="text-xs font-bold uppercase tracking-wider">Turn</span>
            <ArrowRight size={15} />
          </ActionButton>

          <ActionButton
            tone="outline"
            onClick={onMoreOpen}
            aria-label="More actions"
            title="More actions"
            className="h-12 w-9 sm:w-10 shrink-0 px-0"
          >
            <span className="text-base font-bold leading-none">⋯</span>
          </ActionButton>
        </div>
      </div>

      {/* End Frame: Ergonomic Safety Guardrail (drastically smaller 28px height, muted styling, isolated position) */}
      <div className="flex items-center justify-center pt-0.5">
        <button
          type="button"
          onClick={onEndFrame}
          aria-label="End frame"
          className="flex h-7 items-center gap-1.5 rounded-[6px] border border-border/70 bg-surface/50 px-3 text-[11px] font-mono text-muted-foreground hover:border-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
        >
          <Flag size={11} className="text-muted-foreground group-hover:text-destructive" />
          <span>End frame</span>
        </button>
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