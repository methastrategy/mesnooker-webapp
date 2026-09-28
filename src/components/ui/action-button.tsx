"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "danger" | "violation" | "gold" | "outline";

const TONE_CLASS: Record<Tone, string> = {
  primary: "bg-[#3ecf8e] text-zinc-950 font-bold hover:bg-[#4ade80] active:bg-[#24b47e] border border-[#3ecf8e]/60 shadow-sm",
  danger: "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 active:bg-rose-500/30 border border-rose-500/30",
  violation: "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 active:bg-amber-500/30 border border-amber-500/30",
  gold: "bg-amber-400 text-zinc-950 font-bold hover:bg-amber-300 border border-amber-400/60 shadow-sm",
  outline: "bg-white/[0.04] text-zinc-200 border border-white/10 hover:bg-white/[0.08] hover:border-white/20 active:bg-white/[0.03]",
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
        "inline-flex h-12 select-none items-center justify-center gap-1.5 rounded-xl px-4 text-center text-sm font-semibold tracking-wide transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
        TONE_CLASS[tone],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}