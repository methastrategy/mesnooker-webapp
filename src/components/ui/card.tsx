"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Raycast-style flat structural card with 1px solid hairline border.
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28, delay }}
      className={cn("glass relative overflow-hidden", className)}
    >
      {children}
    </motion.div>
  );
}