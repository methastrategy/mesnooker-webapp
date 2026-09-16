"use client";

import { ArrowRight, ChevronLeft, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui";

/** Turn cluster: one consistent equal-height control surface.
 *  End turn is the primary action; Prev / Reverse / Skip are compact icons
 *  (corrective / rota helpers, not headline scoring). */
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
    <div className="flex items-center gap-2">
      <Button variant="outline" size="tile" onClick={onPrev} aria-label="Previous shooter" title="Previous shooter" className="h-14 w-14 shrink-0">
        <ChevronLeft size={18} />
      </Button>
      <Button variant="default" size="tile" onClick={onEndTurn} className="h-14 flex-1">
        <ArrowRight size={18} /> End turn
      </Button>
      <Button
        variant={reverse ? "gold" : "outline"}
        size="tile"
        onClick={onReverse}
        aria-label="Reverse order"
        title="Reverse order"
        className="h-14 w-14 shrink-0"
      >
        <RotateCcw size={18} />
      </Button>
      <Button variant="ghost" size="tile" onClick={onSkip} aria-label="Skip player" title="Skip player" className="h-14 w-12 shrink-0">
        <SkipForward size={18} />
      </Button>
    </div>
  );
}