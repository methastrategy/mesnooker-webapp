"use client";

import type { BallCounts, BallColor, GameMode } from "@/types";
import { BALL_ORDER, BALL_NAME, ballValue } from "@/lib/rules";
import { SnookerBall } from "@/components/ui/snooker-ball";

/** Live ball pad: click a ball to pot it, shows remaining counts */
export function BallPad({
  ballCounts,
  mode,
  onPot,
  disabled,
}: {
  ballCounts: BallCounts;
  mode: GameMode;
  onPot: (ball: BallColor) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
      {BALL_ORDER.map((c) => {
        const left = ballCounts[c];
        const value = ballValue(c, mode);
        return (
          <div key={c} className="flex flex-col items-center gap-1">
            <SnookerBall
              color={c}
              onClick={() => onPot(c)}
              disabled={disabled || left <= 0}
              value={value}
            />
            <span className="text-[10px] text-muted-foreground">
              {BALL_NAME[c]} {left > 0 ? `×${left}` : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}