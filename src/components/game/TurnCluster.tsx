"use client";

import { ArrowRight, MoreHorizontal } from "lucide-react";
import { ActionButton } from "@/components/ui";
import { MoreActionsSheet } from "@/components/game/MoreActionsSheet";

/** Primary turn cluster — the headline scoring control (End turn) plus a single
 *  "⋯ More" key that opens the popup holding the seldom-used, easy-to-misfire
 *  controls (Undo / Prev / Reverse / Skip / End frame). */
export function TurnCluster({
  onEndTurn,
  moreOpen,
  onMoreOpen,
  onMoreClose,
  canUndo,
  onUndo,
  onPrev,
  onReverse,
  onSkip,
  reverse,
  onEndFrame,
}: {
  onEndTurn: () => void;
  moreOpen: boolean;
  onMoreOpen: () => void;
  onMoreClose: () => void;
  canUndo: boolean;
  onUndo: () => void;
  onPrev: () => void;
  onReverse: () => void;
  onSkip: () => void;
  reverse: boolean;
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
        onUndo={onUndo}
        onPrev={onPrev}
        onReverse={onReverse}
        onSkip={onSkip}
        reverse={reverse}
        onEndFrame={onEndFrame}
      />
    </>
  );
}