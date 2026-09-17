"use client";

import { Undo2, Redo2 } from "lucide-react";
import { Sheet, ActionButton } from "@/components/ui";

/** Popup (bottom sheet on mobile / right sheet on desktop) holding exactly the
 *  two controls for fixing a wrong press: Undo returns the whole match to the
 *  instant before the last scoring tap (pot, foul, miss, solve, end-turn —
 *  including the auto-pass that followed), Redo re-applies it. Nothing else
 *  lives here, so there is nothing to misfire. */
export function MoreActionsSheet({
  open,
  onClose,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  open: boolean;
  onClose: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Fix a wrong press">
      <div className="grid grid-cols-2 gap-3">
        <ActionButton tone="outline" onClick={onUndo} disabled={!canUndo} aria-label="Undo last action">
          <Undo2 size={18} /> <span>Undo</span>
        </ActionButton>
        <ActionButton tone="outline" onClick={onRedo} disabled={!canRedo} aria-label="Redo last action">
          <Redo2 size={18} /> <span>Redo</span>
        </ActionButton>
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Undo steps the whole match back to just before the last pot, foul, miss,
        solve or turn change — so a stray tap can be undone completely.
      </p>
    </Sheet>
  );
}