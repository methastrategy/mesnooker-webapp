"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/** Animated rolling number that springs on change */
export function AnimatedNumber({
  value,
  className,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(value);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      setDisplay(value);
      first.current = false;
      return;
    }
    setDisplay(value);
  }, [value]);

  const formatted = `${prefix}${display.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${suffix}`;

  return (
    <span className={cn("relative inline-block", className)}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={formatted}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="inline-block tabular-nums"
        >
          {formatted}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Small label + rolling value pair, used across dashboards */
export function Stat({
  label,
  value,
  suffix,
  prefix,
  decimals = 0,
  variant = "default",
  className,
}: {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  variant?: "default" | "money" | "accent";
  className?: string;
}) {
  const color =
    variant === "money"
      ? value < 0
        ? "text-destructive"
        : "text-primary"
      : variant === "accent"
      ? "text-gold"
      : "text-foreground";
  const sign = variant === "money" && value > 0 ? "+" : "";
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={cn("text-2xl font-bold tabular-nums leading-tight", color)}>
        {sign}
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </span>
    </div>
  );
}