"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type Tone = "primary" | "danger" | "violation" | "gold" | "outline";

const TONE_CLASS: Record<Tone, string> = {
  primary:
    "bg-primary text-primary-foreground font-bold hover:bg-primary-hover border border-primary/50 border-t-white/30",
  danger:
    "bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/35 border-t-destructive/50",
  violation:
    "bg-violation/15 text-violation hover:bg-violation/25 border border-violation/35 border-t-violation/50",
  gold:
    "bg-gold text-primary-foreground font-bold hover:opacity-90 border border-gold/50 border-t-white/30",
  outline:
    "bg-card text-foreground border border-border border-t-white/12 hover:bg-[#1a1b1d]",
};

/**
 * Raycast-grade tactile command keycap button.
 * Flat surface elevation, 8px radius, physical Y-axis keycap depression.
 */
export function ActionButton({
  tone = "primary",
  className,
  children,
  disabled,
  ...props
}: Omit<HTMLMotionProps<"button">, "ref"> & {
  tone?: Tone;
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      whileTap={disabled ? undefined : { y: 2, filter: "brightness(0.86)" }}
      transition={{ type: "spring", stiffness: 600, damping: 28 }}
      className={cn(
        "inline-flex h-12 select-none items-center justify-center gap-1.5 rounded-[8px] px-4 text-center text-sm font-semibold tracking-wide transition-colors disabled:opacity-35 disabled:pointer-events-none cursor-pointer",
        TONE_CLASS[tone],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}