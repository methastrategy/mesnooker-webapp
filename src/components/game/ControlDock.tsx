"use client";

import { ArrowRight, Flag, Undo2 } from "lucide-react";
import { ActionButton } from "@/components/ui";
import { ViolationPanel } from "@/components/game/ViolationPanel";
import { MoreActionsSheet } from "@/components/game/MoreActionsSheet";
import type { GameMode } from "@/types";

/**
 * ControlDock — Pro Ergonomic Snooker Command Deck:
 * Row 1 (Scoring Keycaps): FOUL (−4/−2) | MISS (−2/−1) | SOLVE (+1) | RED (+1)
 * Row 2 (Match Flow): UNDO (1-tap) | TURN (Dominant hero key) | MORE (⋯) | END FRAME
 * Designed for comfortable thumb tapping on mobile and generous click targets on desktop.
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
    <div className="control-dock w-full max-w-3xl mx-auto flex flex-col gap-1.5 sm:gap-2.5">
      {/* ─── Row 1: The 4 Big Tactical Keycaps (Foul, Miss, Solve, Red) ─── */}
      <ViolationPanel
        mode={mode}
        onFoul={onFoul}
        onMiss={onMiss}
        onSolve={onSolve}
        onPotRed={onPotRed}
        canPotRed={canPotRed}
      />

      {/* ─── Row 2: Turn Flow, Quick Undo, More & End Frame ─── */}
      <div className="flex items-center gap-1.5 sm:gap-2 w-full">
        {/* Quick Undo (Immediate 1-tap correction) */}
        <ActionButton
          tone="outline"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last action"
          title="Undo last action"
          className="h-13 min-[380px]:h-14 sm:h-14 md:h-16 px-2.5 sm:px-4 min-w-[58px] sm:min-w-[80px] rounded-2xl flex-col sm:flex-row gap-0.5 sm:gap-1.5 border-border/80"
        >
          <Undo2 size={18} className={canUndo ? "text-primary" : "text-muted-foreground"} />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Undo</span>
        </ActionButton>

        {/* Primary TURN Action Button — Dominant, tactile thumb target */}
        <ActionButton
          tone="primary"
          onClick={onEndTurn}
          aria-label="Pass turn to next player"
          className="h-13 min-[380px]:h-14 sm:h-14 md:h-16 flex-1 px-4 sm:px-8 gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-primary to-amber-600 text-stone-950 font-black shadow-lg shadow-primary/25 hover:brightness-110 transition-all cursor-pointer"
        >
          <span className="text-sm sm:text-base md:text-lg font-black tracking-widest uppercase">
            TURN
          </span>
          <ArrowRight size={20} className="stroke-[2.8]" />
        </ActionButton>

        {/* More Actions (⋯) — Redo & detailed log */}
        <ActionButton
          tone="outline"
          onClick={onMoreOpen}
          aria-label="More options"
          title="More options"
          className="h-13 min-[380px]:h-14 sm:h-14 md:h-16 w-11 sm:w-14 shrink-0 px-0 rounded-2xl border-border/80"
        >
          <span className="text-xl font-black leading-none">⋯</span>
        </ActionButton>

        {/* End Frame Button */}
        <ActionButton
          tone="outline"
          onClick={onEndFrame}
          aria-label="End current frame"
          title="End frame"
          className="h-13 min-[380px]:h-14 sm:h-14 md:h-16 px-2.5 sm:px-4 min-w-[62px] sm:min-w-[90px] rounded-2xl flex-col sm:flex-row gap-0.5 sm:gap-1.5 border-border/80 hover:border-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <Flag size={15} className="text-muted-foreground group-hover:text-destructive" />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap">End</span>
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