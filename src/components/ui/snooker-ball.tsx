"use client";

import { motion } from "framer-motion";
import type { BallColor } from "@/types";
import { BALL_HEX, BALL_NAME } from "@/lib/rules";
import { cn } from "@/lib/utils";

/** Styled snooker ball with gloss */
export function SnookerBall({
  color,
  size = 52,
  disabled,
  onClick,
  value,
  selected,
}: {
  color: BallColor;
  size?: number;
  disabled?: boolean;
  onClick?: () => void;
  value?: string | number;
  selected?: boolean;
}) {
  const hex = BALL_HEX[color];
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.9 }}
      whileHover={disabled ? undefined : { scale: 1.06 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn(
        "snooker-ball ball-rim relative flex items-center justify-center font-bold text-black/80 select-none",
        disabled && "opacity-15 pointer-events-none",
        selected && "ring-2 ring-gold ring-offset-2 ring-offset-black"
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45), ${hex} 60%, rgba(0,0,0,0.25))`,
        fontSize: size * 0.4,
      }}
      aria-label={`${BALL_NAME[color]} ball${value !== undefined ? ` $${value}` : ""}`}
    >
      {value !== undefined ? value : ""}
    </motion.button>
  );
}

/** Color key dot */
export function BallDot({ color, size = 10 }: { color: BallColor; size?: number }) {
  return (
    <span
      className="snooker-ball inline-block"
      style={{ width: size, height: size, background: BALL_HEX[color] }}
    />
  );
}