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
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { y: 2, scale: 0.94, filter: "brightness(0.85)" }}
      whileHover={disabled ? undefined : { scale: 1.04, filter: "brightness(1.08)" }}
      transition={{ type: "spring", stiffness: 600, damping: 28 }}
      className={cn(
        "relative flex shrink-0 items-center justify-center font-bold font-mono select-none rounded-full transition-all cursor-pointer",
        "border border-white/20 border-t-white/45 border-b-black/60 shadow-md",
        isLight ? "text-zinc-950 font-black" : "text-white font-black",
        disabled && "opacity-20 pointer-events-none grayscale-[60%]",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_14px_rgba(204,120,92,0.4)]",
        !size && "w-11 h-11 min-[380px]:w-12 min-[380px]:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-[15px] min-[380px]:text-[17px] sm:text-[20px] md:text-[24px]",
        className
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${hex} 80%, white) 0%, ${hex} 55%, color-mix(in srgb, ${hex} 65%, black) 100%)`,
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