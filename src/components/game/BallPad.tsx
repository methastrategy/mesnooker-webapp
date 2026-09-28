"use client";

import type { BallColor } from "@/types";
import { BALL_HEX, BALL_NAME, COLOUR_ORDER } from "@/lib/rules";
import { SnookerBall } from "@/components/ui/snooker-ball";
import { cn } from "@/lib/utils";

/** Live ball pad: shows ONLY the legally pottable balls for the current break phase. */
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
  if (!legal.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] py-6 text-center text-sm text-muted-foreground">
        No legal shots right now.
      </div>
    );
  }
  const legalSet = new Set(legal);
  return (
    <div className="relative mx-auto w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#0c0d11] p-4 md:p-5 shadow-lg">
      {clearingColours ? (
        /* Linear-style clear rack tracker */
        <div className="relative mb-4 flex items-center justify-center gap-2 border-b border-white/[0.06] pb-3">
          {COLOUR_ORDER.map((c, i) => {
            const onNow = legalSet.has(c);
            const done = showCount ? showCount(c) === 0 : false;
            return (
              <div key={c} className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-mono font-bold transition-all",
                    onNow ? "ring-2 ring-primary ring-offset-1 ring-offset-[#0c0d11] scale-110" : "opacity-40"
                  )}
                  style={{ background: BALL_HEX[c], color: c === "yellow" ? "#000" : "#fff" }}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-mono leading-none",
                    onNow ? "font-bold text-white" : done ? "text-zinc-600 line-through" : "text-zinc-400"
                  )}
                >
                  {BALL_NAME[c]}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="relative flex flex-wrap items-center justify-center gap-4 md:gap-5 py-2">
        {legal.map((c) => {
          const value = ballValues[c];
          const left = showCount ? showCount(c) : 0;
          return (
            <div key={c} className="relative flex flex-col items-center gap-1.5">
              <SnookerBall
                color={c}
                size={70}
                value={value}
                disabled={left <= 0}
                selected
                onClick={() => onPot(c)}
              />
              <div className="flex items-center gap-1 rounded-md bg-white/[0.06] px-2 py-0.5 border border-white/[0.06]">
                <span className="text-[11px] font-medium text-zinc-300 leading-tight">
                  {BALL_NAME[c]}
                </span>
                {left > 0 ? (
                  <span className="font-mono text-[10px] text-zinc-400">×{left}</span>
                ) : (
                  <span className="font-mono text-[10px] text-rose-400">0</span>
                )}
              </div>
              {left > 0 && left > 1 ? (
                <span className="absolute -right-1 -top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 border border-white/20 px-1 font-mono text-[10px] font-bold text-white shadow-md">
                  {left}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}