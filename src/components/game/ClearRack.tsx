"use client";

import { motion } from "framer-motion";
import type { BallColor } from "@/types";
import { BALL_HEX, BALL_NAME, COLOUR_ORDER } from "@/lib/rules";
import { SnookerBall, Badge } from "@/components/ui";

/** Non-blocking "Clear the table" control.
 *  Replaces the old full-screen modal: the official colour-order rack is shown
 *  inline (yellow → green → brown → blue → pink → black) with only the next
 *  colour pottable. The action pad stays usable — no blocking overlay. */
export function ClearRack({
  done,
  nextColour,
  ballValues,
  onPot,
}: {
  done: Record<BallColor, boolean>;
  nextColour?: BallColor;
  ballValues: Record<BallColor, number>;
  onPot: (ball: BallColor) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong glow-gold flex flex-col gap-3 p-4"
      role="region"
      aria-label="Clear the table — colours must be potted in order"
    >
      <div className="flex items-center justify-between">
        <Badge variant="gold">Clear the table</Badge>
        <span className="text-[11px] text-muted-foreground">
          Colours in order — no skipping
        </span>
      </div>

      {/* official order rack */}
      <div className="flex items-center justify-center gap-1.5 md:gap-2">
        {COLOUR_ORDER.map((c, i) => {
          const isDone = done[c];
          const onNow = c === nextColour;
          return (
            <div key={c} className="flex flex-col items-center gap-1">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                  onNow ? "ring-2 ring-gold text-black/80" : isDone ? "text-white/50" : "text-black/60"
                }`}
                style={{ background: BALL_HEX[c], opacity: isDone ? 0.4 : 1 }}
              >
                {i + 1}
              </span>
              <span className={`text-[8px] leading-none ${onNow ? "font-bold text-white" : "text-white/45"}`}>
                {BALL_NAME[c]}
              </span>
              {isDone ? <span className="text-[8px] text-white/40">✔</span> : null}
            </div>
          );
        })}
      </div>

      {/* only the next colour is pottable */}
      <div className="flex flex-col items-center gap-2">
        {nextColour ? (
          <>
            <SnookerBall
              color={nextColour}
              size={88}
              value={ballValues[nextColour]}
              selected
              onClick={() => onPot(nextColour)}
            />
            <span className="text-xs text-foreground/70">
              Pot the{" "}
              <span className="font-bold" style={{ color: BALL_HEX[nextColour] }}>
                {BALL_NAME[nextColour]}
              </span>{" "}
              ball
            </span>
          </>
        ) : (
          <p className="py-4 text-center text-sm text-gold">Table cleared — nice shuffle! 🎉</p>
        )}
      </div>
    </motion.div>
  );
}