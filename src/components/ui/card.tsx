"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Glassmorphism card with optional emerald/gold glow and a premium top-edge
 * highlight (a thin light catch on the upper border, like a lit edge).
 */
export function GlassCard({
  children,
  className,
  glow,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { glow?: "emerald" | "gold" | "none" }) {
  return (
    <div
      className={cn(
        "glass relative overflow-hidden",
        glow === "emerald" && "glow-emerald",
        glow === "gold" && "glow-gold",
        className
      )}
      {...props}
    >
      {/* top edge light catch */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />
      {children}
    </div>
  );
}

export interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
}

/** Slide-up animated card for staggered page entrance */
export function AnimatedCard({
  children,
  className,
  delay = 0,
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay }}
      className={cn("glass relative overflow-hidden", className)}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />
      {children}
    </motion.div>
  );
}