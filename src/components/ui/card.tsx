"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Glassmorphism card with emerald glow option */
export function GlassCard({
  children,
  className,
  glow,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { glow?: "emerald" | "gold" | "none" }) {
  return (
    <div
      className={cn(
        "glass relative",
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay }}
      className={cn("glass", className)}
    >
      {children}
    </motion.div>
  );
}