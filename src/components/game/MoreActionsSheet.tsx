"use client";

import { Undo2, ChevronLeft, RotateCcw, SkipForward, Flag } from "lucide-react";
import { Sheet, ActionButton } from "@/components/ui";

/** Popup (bottom sheet on mobile / right sheet on desktop) holding the
 *  seldom-pressed, easy-to-misfire controls: Undo, Prev player, Reverse order,
 *  Skip player, and End frame. Kept off the main action surface so an operator
 *  never taps them by accident. */
export function MoreActionsSheet({
  open,
  onClose,
  canUndo,
  onUndo,
  onPrev,
  onReverse,
  onSkip,
  reverse,
  onEndFrame,
}: {
  open: boolean;
  onClose: () => void;
  canUndo: boolean;
  onUndo: () => void;
  onPrev: () => void;
  onReverse: () => void;
  onSkip: () => void;
  reverse: boolean;
  onEndFrame: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Actions">
      <div className="grid grid-cols-2 gap-3">
        <ActionButton tone="outline" onClick={onUndo} disabled={!canUndo} aria-label="Undo last action">
          <Undo2 size={18} /> <span>Undo</span>
        </ActionButton>
        <ActionButton tone="outline" onClick={onPrev} aria-label="Previous shooter">
          <ChevronLeft size={18} /> <span>Prev</span>
        </ActionButton>
        <ActionButton tone={reverse ? "gold" : "outline"} onClick={onReverse} aria-label="Reverse order">
          <RotateCcw size={18} /> <span>{reverse ? "Reverse ✓" : "Reverse"}</span>
        </ActionButton>
        <ActionButton tone="outline" onClick={onSkip} aria-label="Skip player">
          <SkipForward size={18} /> <span>Skip</span>
        </ActionButton>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          Predicaments & table controls — safe from accidental taps.
        </span>
      </div>
      <div className="mt-5">
        <ActionButton tone="outline" onClick={onEndFrame} className="w-full text-destructive">
          <Flag size={18} /> End frame
        </ActionButton>
      </div>
    </Sheet>
  );
}