"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "danger" | "violation" | "gold" | "outline";

const TONE_CLASS: Record<Tone, string> = {
  // Each tone uses the semantic token as the keycap base, tinted by the
  // shared `.action-key` top gradient so every action tile reads as a
  // tactile raised button from the same family.
  primary: "bg-primary text-primary-foreground border-primary/50",
  danger: "bg-destructive text-white border-destructive/60",
  violation: "bg-violation text-black border-violation/60",
  gold: "bg-gold text-black border-gold/60",
  outline: "bg-white/5 text-foreground border-white/20 hover:bg-white/10",
};

/**
 * Tactile "action key" — a plain (non-motion) button sharing one raised-keycap
 * look across the Match action tiles. The CSS `.action-key` class owns the
 * keycap depth + press-down travel (CSS :active, not framer, so the transform
 * isn't clobbered). Use for ALL match actions — End turn / Foul / Snooker miss /
 * Solve / Prev / Reverse / Skip so they read as one button family.
 */
export function ActionButton({
  tone = "primary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: Tone;
}) {
  return (
    <button
      type="button"
      className={cn(
        "action-key inline-flex h-14 select-none items-center justify-center gap-1.5 rounded-[18px] px-4 text-center font-semibold leading-tight",
        TONE_CLASS[tone],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}