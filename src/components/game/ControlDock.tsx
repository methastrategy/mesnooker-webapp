"use client";

import { ArrowRight, Flag } from "lucide-react";
import { ActionButton } from "@/components/ui";
import { ViolationPanel } from "@/components/game/ViolationPanel";
import { MoreActionsSheet } from "@/components/game/MoreActionsSheet";
import type { GameMode } from "@/types";

/**
 * ControlDock — Raycast Ergonomic Command Deck:
 * 1. Penalties Group: Foul (−4/−2) & Miss (−2/−1) grouped side-by-side in capsule.
 * 2. Solve (+1): Always enabled for escaping snookers.
 * 3. Red Pot (+1): Active & bright ONLY when on red, dimmed when on colour.
 * 4. Next Turn: Dominant primary action button (full 48px height, high-contrast green).
 * 5. More (⋯): Undo/Redo quick sheet.
 * 6. End Frame: Ergonomically separated below the deck with distinct compact footprint (28px height, muted) to prevent accidental mis-taps.
 */
export function ControlDock({
  mode,
  onFoul,
  onMiss,
  onSolve,
  onPotRed,
  canPotRed = true,
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
  onPotRed?: () => void;
  canPotRed?: boolean;
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
        {/* Penalties Group + Solve + Red Pot */}
        <ViolationPanel
          mode={mode}
          onFoul={onFoul}
          onMiss={onMiss}
          onSolve={onSolve}
          onPotRed={onPotRed}
          canPotRed={canPotRed}
        />

        <div className="mx-0.5 sm:mx-1 h-8 w-px shrink-0 bg-border/80" />

        {/* Turn & More Group */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ActionButton
            tone="primary"
            onClick={onEndTurn}
            className="h-12 min-w-[80px] sm:min-w-[104px] px-4 sm:px-6 gap-2 rounded-full shadow-lg shadow-primary/25 font-black uppercase tracking-wider"
            aria-label="End turn"
          >
            <span className="text-xs sm:text-sm font-black">Turn</span>
            <ArrowRight size={16} />
          </ActionButton>

          <ActionButton
            tone="outline"
            onClick={onMoreOpen}
            aria-label="More actions"
            title="More actions"
            className="h-12 w-11 shrink-0 px-0 rounded-full"
          >
            <span className="text-lg font-bold leading-none">⋯</span>
          </ActionButton>
        </div>
      </div>

      {/* End Frame: Ergonomic Safety Guardrail */}
      <div className="flex items-center justify-center pt-0.5">
        <button
          type="button"
          onClick={onEndFrame}
          aria-label="End frame"
          className="flex h-7 items-center gap-1.5 rounded-full border border-border/80 bg-surface/80 px-4 text-[11px] font-mono font-medium text-muted-foreground hover:border-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer shadow-xs active:scale-95"
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