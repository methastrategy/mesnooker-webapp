"use client";

import { Undo2, Redo2, RotateCcw } from "lucide-react";
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
    <Sheet open={open} onClose={onClose} title="Fix Wrong Action">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <ActionButton
            tone="outline"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo last action"
            className="h-16 flex-col gap-1 rounded-[18px] border-border/80"
          >
            <Undo2 size={20} className={canUndo ? "text-primary" : "text-muted-foreground"} />
            <span className="text-xs font-bold uppercase tracking-wider">Undo</span>
          </ActionButton>
          <ActionButton
            tone="outline"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo last action"
            className="h-16 flex-col gap-1 rounded-[18px] border-border/80"
          >
            <Redo2 size={20} className={canRedo ? "text-primary" : "text-muted-foreground"} />
            <span className="text-xs font-bold uppercase tracking-wider">Redo</span>
          </ActionButton>
        </div>

        <div className="rounded-[16px] border border-border/70 bg-surface/75 p-3.5 flex items-start gap-2.5 shadow-xs">
          <RotateCcw size={16} className="text-primary shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Undo steps the entire match state back to just before the last scoring pot, foul,
            miss, solve or turn change — so any accidental tap can be reversed safely.
          </p>
        </div>
      </div>
    </Sheet>
  );
}