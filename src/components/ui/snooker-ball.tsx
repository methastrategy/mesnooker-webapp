"use client";

import { motion } from "framer-motion";
import type { BallColor } from "@/types";
import { BALL_HEX, BALL_NAME } from "@/lib/rules";
import { cn } from "@/lib/utils";

/** Raycast Keycap style snooker ball */
export function SnookerBall({
  color,
  size,
  disabled,
  onClick,
  value,
  selected,
  className,
}: {
  color: BallColor;
  size?: number;
  disabled?: boolean;
  onClick?: () => void;
  value?: string | number;
  selected?: boolean;
  className?: string;
}) {
  const hex = BALL_HEX[color];
  const isLight = color === "yellow" || color === "pink";

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { y: 2, filter: "brightness(0.85)" }}
      whileHover={disabled ? undefined : { filter: "brightness(1.1)" }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "relative flex shrink-0 items-center justify-center font-bold font-mono select-none rounded-full transition-all",
        "border border-white/10 shadow-sm",
        isLight ? "text-zinc-900" : "text-white",
        disabled && "opacity-20 pointer-events-none grayscale-[50%]",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-[#07080a]",
        !size && "w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 text-[16px] sm:text-[20px] md:text-[24px]", // fluid sizes if no explicit size
        className
      )}
      style={{
        width: size,
        height: size,
        // Raycast keycap subtle top-down gradient
        background: `linear-gradient(180deg, ${hex} 0%, color-mix(in srgb, ${hex} 80%, black) 100%)`,
        fontSize: size ? size * 0.4 : undefined,
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
      className="inline-block rounded-full border border-white/10"
      style={{ width: size, height: size, background: BALL_HEX[color] }}
    />
  );
}