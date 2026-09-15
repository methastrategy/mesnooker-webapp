"use client";

import type { BallColor } from "@/types";
import { BALL_NAME } from "@/lib/rules";
import { SnookerBall } from "@/components/ui/snooker-ball";

/** Live ball pad: shows ONLY the legally pottable balls for the current break phase. */
export function BallPad({
  legal,
  ballValues,
  onPot,
  showCount,
}: {
  legal: BallColor[];
  ballValues: Record<BallColor, number>;
  onPot: (ball: BallColor) => void;
  showCount?: (ball: BallColor) => number;
}) {
  if (!legal.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] py-6 text-center text-sm text-muted-foreground">
        No legal shots right now.
      </div>
    );
  }
  return (
    <div className="relative mx-auto w-full max-w-xl rounded-2xl bg-[radial-gradient(120%_120%_at_50%_0%,#0e7a3a_0%,#0a5a27_55%,#073d1a_100%)] p-4 shadow-[inset_0_0_30px_rgba(0,0,0,0.45),0_12px_30px_rgba(0,0,0,0.5)]">
      {/* soft top light reflection on the felt */}
      <div className="pointer-events-none absolute inset-x-4 top-2 h-6 rounded-t-2xl bg-white/[0.06] blur-md" />
      <div className="relative flex flex-wrap items-center justify-center gap-3">
        {legal.map((c) => {
          const value = ballValues[c];
          const left = showCount ? showCount(c) : 0;
          return (
            <div key={c} className="group-relative flex flex-col items-center gap-1">
              <SnookerBall
                color={c}
                size={72}
                value={value}
                disabled={left <= 0}
                selected
                onClick={() => onPot(c)}
              />
              <span className="text-[10px] text-white/70 leading-none">
                {BALL_NAME[c]}
                {left > 0 ? (
                  <span className="ml-1 rounded-full bg-black/60 px-1.5 text-[10px] text-white">×{left}</span>
                ) : (
                  <span className="ml-1 rounded-full bg-destructive/30 px-1.5 text-[10px] text-destructive"> —</span>
                )}
              </span>
              {left > 0 ? (
                <span className="absolute -right-1 -top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-black/70 px-1 text-[9px] text-white shadow">
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