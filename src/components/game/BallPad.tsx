"use client";

import * as React from "react";
import type { BallColor } from "@/types";
import { BALL_HEX, BALL_NAME, BALL_ORDER, COLOUR_ORDER } from "@/lib/rules";
import { SnookerBall } from "@/components/ui/snooker-ball";
import { cn } from "@/lib/utils";

/** Live ball pad: always renders all 7 balls in a stable single row so the
 *  container never shifts or jumps between red/colour phases. */
export function BallPad({
  legal,
  ballValues,
  onPot,
  showCount,
  clearingColours,
}: {
  legal: BallColor[];
  ballValues: Record<BallColor, number>;
  onPot: (ball: BallColor) => void;
  showCount?: (ball: BallColor) => number;
  /** true once all reds are gone; only the exact next colour is legal */
  clearingColours?: boolean;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateScrollHints = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  React.useEffect(() => {
    updateScrollHints();
    const el = scrollRef.current;
    if (!el) return;
    window.addEventListener("resize", updateScrollHints);
    return () => window.removeEventListener("resize", updateScrollHints);
  }, [updateScrollHints, legal]);

  if (!legal.length) {
    return (
      <div className="rounded-[10px] border border-dashed border-border bg-surface py-6 text-center text-sm text-muted-foreground">
        No legal shots right now.
      </div>
    );
  }
  const legalSet = new Set(legal);
  return (
    <div className="relative mx-auto w-full max-w-xl rounded-[10px] border border-border bg-surface p-3 sm:p-4 md:p-5">
      {clearingColours ? (
        /* Raycast-style clear rack tracker */
        <div className="relative mb-3 flex items-center justify-center gap-2 border-b border-border pb-3">
          {COLOUR_ORDER.map((c, i) => {
            const onNow = legalSet.has(c);
            const done = showCount ? showCount(c) === 0 : false;
            return (
              <div key={c} className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-mono font-bold transition-all",
                    onNow ? "ring-2 ring-primary ring-offset-1 ring-offset-surface scale-110" : "opacity-40"
                  )}
                  style={{ background: BALL_HEX[c], color: c === "yellow" ? "#000" : "#fff" }}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-mono leading-none",
                    onNow ? "font-bold text-foreground" : done ? "text-muted-foreground/50 line-through" : "text-muted-foreground"
                  )}
                >
                  {BALL_NAME[c]}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="relative w-full overflow-hidden">
        {/* Left fade hint when scrolled horizontally on compact screens */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface via-surface/80 to-transparent z-10 transition-opacity duration-200 sm:hidden",
            canScrollLeft ? "opacity-100" : "opacity-0"
          )}
        />
        {/* Right fade hint for horizontal scrolling on 320px-375px screens */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-surface via-surface/85 to-transparent z-10 transition-opacity duration-200 sm:hidden",
            canScrollRight ? "opacity-100" : "opacity-60"
          )}
        />

        <div
          ref={scrollRef}
          onScroll={updateScrollHints}
          className="w-full overflow-x-auto no-scrollbar py-1.5"
        >
          <div className="mx-auto flex w-max flex-row flex-nowrap items-center gap-1.5 min-[380px]:gap-2 sm:gap-3 px-1">
            {BALL_ORDER.map((c) => {
              const isLegal = legalSet.has(c);
              const value = ballValues[c];
              const left = showCount ? showCount(c) : 0;
              return (
                <div key={c} className="relative flex flex-col items-center gap-1.5 shrink-0">
                  <SnookerBall
                    color={c}
                    value={value}
                    disabled={!isLegal || left <= 0}
                    selected={isLegal}
                    onClick={() => onPot(c)}
                  />
                  <div className="flex items-center gap-1 rounded-[6px] bg-card px-1.5 py-0.5 border border-border">
                    <span className="text-[9px] sm:text-[10px] font-medium text-foreground/85 leading-tight">
                      {BALL_NAME[c]}
                    </span>
                    {left > 0 ? (
                      <span className="font-mono text-[9px] text-muted-foreground">×{left}</span>
                    ) : (
                      <span className="font-mono text-[9px] text-destructive">0</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}