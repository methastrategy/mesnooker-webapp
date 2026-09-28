"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "danger" | "violation" | "gold" | "outline";

const TONE_CLASS: Record<Tone, string> = {
  primary: "bg-primary text-primary-foreground border-primary/60 shadow-[0_0_12px_rgba(255,209,102,0.2)]",
  danger: "bg-destructive text-white border-destructive/70 shadow-[0_0_10px_rgba(225,29,72,0.25)]",
  violation: "bg-violation text-black border-violation/70",
  gold: "bg-gold text-black border-gold/70 shadow-[0_0_12px_rgba(255,209,102,0.2)]",
  outline: "bg-white/[0.04] text-foreground border-white/15 hover:bg-white/[0.08] hover:border-white/25",
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