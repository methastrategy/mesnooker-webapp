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
      className="rounded-[10px] border border-gold/30 bg-card p-3 sm:p-4 flex flex-col gap-3"
      role="region"
      aria-label="Clear the table — colours must be potted in order"
    >
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <Badge variant="gold">Clear the table</Badge>
        <span className="text-[11px] font-mono text-muted-foreground">
          Colours in order — no skipping
        </span>
      </div>

      {/* official order rack — safe single row with scroll containment */}
      <div className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 px-0.5">
        {COLOUR_ORDER.map((c, i) => {
          const isDone = done[c];
          const onNow = c === nextColour;
          return (
            <div key={c} className="flex flex-col items-center gap-1 shrink-0">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                  onNow ? "ring-2 ring-gold text-black/80 font-bold" : isDone ? "text-white/50" : "text-black/70"
                }`}
                style={{ background: BALL_HEX[c], opacity: isDone ? 0.35 : 1 }}
              >
                {i + 1}
              </span>
              <span className={`text-[10px] sm:text-[11px] font-mono leading-none ${onNow ? "font-bold text-foreground" : isDone ? "text-muted-foreground line-through opacity-50" : "text-muted-foreground"}`}>
                {BALL_NAME[c]}
              </span>
            </div>
          );
        })}
      </div>

      {/* only the next colour is pottable */}
      <div className="flex flex-col items-center gap-2 pt-1">
        {nextColour ? (
          <>
            <SnookerBall
              color={nextColour}
              size={84}
              value={ballValues[nextColour]}
              selected
              onClick={() => onPot(nextColour)}
            />
            <span className="text-xs font-mono font-medium text-gold animate-pulse">
              ● Tap {BALL_NAME[nextColour]} to pot (+{ballValues[nextColour]})
            </span>
          </>
        ) : (
          <div className="rounded-[8px] bg-primary/10 border border-primary/30 p-3 text-center text-xs font-semibold text-primary">
            🎉 All colours cleared! Frame complete.
          </div>
        )}
      </div>
    </motion.div>
  );
}