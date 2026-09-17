"use client";

import { ArrowRight, MoreHorizontal, Flag } from "lucide-react";
import { ActionButton } from "@/components/ui";
import { MoreActionsSheet } from "@/components/game/MoreActionsSheet";

/** Primary turn cluster — the headline scoring control (End turn) plus a single
 *  "⋯ More" key that opens the popup holding the two safe-to-misfire controls
 *  (Undo / Redo) the operator uses to fix a wrong press. End frame stays on the
 *  main surface, visually separated so it can never be hit by accident, but it
 *  is always reachable without a popup. */
export function TurnCluster({
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
    <>
      <div className="flex items-stretch gap-2">
        <ActionButton tone="primary" onClick={onEndTurn} className="flex-1">
          <ArrowRight size={18} /> End turn
        </ActionButton>
        <ActionButton tone="outline" onClick={onMoreOpen} aria-label="More actions" title="More actions" className="w-14 shrink-0 px-0">
          <MoreHorizontal size={20} />
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
      {/* End frame deliberately below the cluster, styled quiet so a mistake
          requires a deliberate second look. */}
      <div className="flex justify-center pt-1">
        <ActionButton
          tone="outline"
          onClick={onEndFrame}
          aria-label="End frame"
          className="h-10 w-auto min-w-0 px-3 text-destructive shadow-none"
        >
          <Flag size={15} /> End frame
        </ActionButton>
      </div>
    </>
  );
}