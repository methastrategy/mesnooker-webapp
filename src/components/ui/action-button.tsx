"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "danger" | "violation" | "gold" | "outline";

const TONE_CLASS: Record<Tone, string> = {
  primary: "bg-primary text-primary-foreground font-bold hover:bg-primary-hover border border-primary/50",
  danger: "bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/40",
  violation: "bg-violation/20 text-violation hover:bg-violation/30 border border-violation/40",
  gold: "bg-gold text-primary-foreground font-bold hover:opacity-90 border border-gold/50",
  outline: "bg-transparent text-foreground border-border hover:bg-white/[0.05]",
};

/**
 * Linear-grade tactile command action button.
 * Clean, flat, high-contrast, responsive.
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
        "inline-flex h-12 select-none items-center justify-center gap-1.5 rounded-xl px-4 text-center text-sm font-semibold tracking-wide transition-all active:translate-y-[2px] active:brightness-90 disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
        TONE_CLASS[tone],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}