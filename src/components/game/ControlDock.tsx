"use client";

import { ArrowRight, Undo2 } from "lucide-react";
import { ActionButton } from "@/components/ui";
import { ViolationPanel } from "@/components/game/ViolationPanel";
import { MoreActionsSheet } from "@/components/game/MoreActionsSheet";
import type { GameMode } from "@/types";

/**
 * ControlDock — Pro Ergonomic Snooker Command Deck:
 * Row 1 (Scoring Keycaps): FOUL (−4/−2) | MISS (−2/−1) | SOLVE (+1)
 * Row 2 (Match Flow): UNDO (1-tap) | TURN (เปลี่ยนตา / ตบไม่ลง — Dominant Hero Keycap) | MORE (⋯)
 * Designed for comfortable thumb tapping on mobile and generous click targets on desktop.
 * (End Frame, Re-rack, Concede, Free Ball, and Play Again safely live inside MoreActionsSheet).
 */
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
  onReRack,
  onConcede,
  onOpenFoulOptions,
  onPlayAgain,
  onToggleFreeBall,
  freeBallActive = false,
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
  onReRack?: () => void;
  onConcede?: () => void;
  onOpenFoulOptions?: () => void;
  onPlayAgain?: () => void;
  onToggleFreeBall?: () => void;
  freeBallActive?: boolean;
}) {
  return (
    <div className="control-dock w-full max-w-3xl mx-auto flex flex-col gap-1.5 sm:gap-2.5">
      {/* ─── Row 1: The 3 Big Tactical Keycaps (Foul, Miss, Solve) ─── */}
      <ViolationPanel
        mode={mode}
        onFoul={onFoul}
        onMiss={onMiss}
        onSolve={onSolve}
        onOpenFoulOptions={onOpenFoulOptions}
      />

      {/* ─── Row 2: Match Flow: Quick Undo, Hero TURN & More Actions ─── */}
      <div className="flex items-center gap-1.5 sm:gap-2 w-full">
        {/* Quick Undo (Immediate 1-tap correction) */}
        <ActionButton
          tone="outline"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last action (Press U)"
          title="Undo last action (Press U)"
          className="h-13 min-[380px]:h-14 sm:h-14 md:h-16 px-2.5 sm:px-4 min-w-[58px] sm:min-w-[80px] rounded-2xl flex-col sm:flex-row gap-0.5 sm:gap-1.5 border-border/80 cursor-pointer"
        >
          <Undo2 size={18} className={canUndo ? "text-primary" : "text-muted-foreground"} />
          <div className="flex items-center gap-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Undo</span>
            <kbd className="hidden sm:inline-flex items-center justify-center text-[9px] font-mono px-1 py-0.5 rounded bg-black/40 text-foreground/70 border border-white/10 leading-none">
              U
            </kbd>
          </div>
        </ActionButton>

        {/* Primary TURN Action Button — Dominant Hero Keycap */}
        <ActionButton
          tone="primary"
          onClick={onEndTurn}
          aria-label="Pass turn to next player (Press Space)"
          className="h-13 min-[380px]:h-14 sm:h-14 md:h-16 flex-1 px-3 sm:px-6 gap-1.5 sm:gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-primary to-amber-600 text-stone-950 font-black shadow-lg shadow-primary/25 hover:brightness-110 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-sm sm:text-base md:text-lg font-black tracking-wider uppercase">
              TURN
            </span>
            <span className="text-[11px] sm:text-xs md:text-sm font-semibold opacity-90 normal-case tracking-normal truncate">
              (เปลี่ยนตา / ตบไม่ลง)
            </span>
          </div>
          <kbd className="hidden md:inline-flex items-center justify-center text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/25 text-stone-950 border border-black/20 font-bold leading-none shrink-0">
            Space
          </kbd>
          <ArrowRight size={20} className="stroke-[2.8] shrink-0" />
        </ActionButton>

        {/* More Actions (⋯) — Opens MoreActionsSheet safely containing End Frame, Re-rack, Concede */}
        <ActionButton
          tone="outline"
          onClick={onMoreOpen}
          aria-label="More options"
          title="More options"
          className="h-13 min-[380px]:h-14 sm:h-14 md:h-16 w-12 sm:w-16 shrink-0 px-0 rounded-2xl border-border/80 hover:border-primary/50 hover:bg-primary/10 transition-all cursor-pointer"
        >
          <span className="text-xl sm:text-2xl font-black leading-none">⋯</span>
        </ActionButton>
      </div>

      <MoreActionsSheet
        open={moreOpen}
        onClose={onMoreClose}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
        onEndFrame={onEndFrame}
        onReRack={onReRack}
        onConcede={onConcede}
        onOpenFoulOptions={onOpenFoulOptions}
        onPlayAgain={onPlayAgain}
        onToggleFreeBall={onToggleFreeBall}
        freeBallActive={freeBallActive}
      />
    </div>
  );
}