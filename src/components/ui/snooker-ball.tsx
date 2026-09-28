"use client";

import { motion } from "framer-motion";
import type { BallColor } from "@/types";
import { BALL_HEX, BALL_NAME } from "@/lib/rules";
import { cn } from "@/lib/utils";

/** Linear-grade minimalist snooker ball */
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
  const isLight = color === "yellow";

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.93 }}
      whileHover={disabled ? undefined : { scale: 1.05 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      className={cn(
        "relative flex items-center justify-center font-bold font-mono select-none rounded-full transition-all",
        isLight ? "text-zinc-950" : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]",
        disabled && "opacity-15 pointer-events-none",
        selected
          ? "ring-2 ring-primary ring-offset-2 ring-offset-[#121212] shadow-[0_0_16px_rgba(62,207,142,0.35)]"
          : "border border-white/20 shadow-sm"
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: hex,
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