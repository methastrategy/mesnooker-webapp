"use client";

import { ArrowRight, ChevronLeft, RotateCcw, SkipForward } from "lucide-react";
import { ActionButton } from "@/components/ui";

/** Turn cluster — the headline scoring control (End turn) plus turn-flow
 *  helpers, all sharing the same tactile keycap family as the violation
 *  tiles so every Match action button reads as one physical button. */
export function TurnCluster({
  onEndTurn,
  onPrev,
  onReverse,
  onSkip,
  reverse,
}: {
  onEndTurn: () => void;
  onPrev: () => void;
  onReverse: () => void;
  onSkip: () => void;
  reverse: boolean;
}) {
  return (
    <div className="flex items-stretch gap-2">
      <ActionButton tone="outline" onClick={onPrev} aria-label="Previous shooter" title="Previous shooter" className="w-14 shrink-0 px-0">
        <ChevronLeft size={18} />
      </ActionButton>
      <ActionButton tone="primary" onClick={onEndTurn} className="flex-1">
        <ArrowRight size={18} /> End turn
      </ActionButton>
      <ActionButton
        tone={reverse ? "gold" : "outline"}
        onClick={onReverse}
        aria-label="Reverse order"
        title="Reverse order"
        className="w-14 shrink-0 px-0"
      >
        <RotateCcw size={18} />
      </ActionButton>
      <ActionButton tone="outline" onClick={onSkip} aria-label="Skip player" title="Skip player" className="w-12 shrink-0 px-0">
        <SkipForward size={18} />
      </ActionButton>
    </div>
  );
}