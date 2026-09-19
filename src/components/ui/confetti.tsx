"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

const COLORS = ["#c7ccd1", "#cabfa0", "#ef4444", "#3b82f6", "#ec4899", "#8b8e93"];

interface ConfettiPiece {
  x: number;
  delay: number;
  rotate: number;
  color: string;
  size: number;
}

/** Lightweight confetti burst, respecting prefers-reduced-motion via CSS props */
export function Confetti({ count = 40 }: { count?: number }) {
  const pieces = useMemo<ConfettiPiece[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (Math.random() - 0.5) * 500,
        delay: Math.random() * 0.3,
        rotate: (Math.random() - 0.5) * 540,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 6,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/4 block rounded-sm"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: p.x,
            y: 500 + Math.random() * 200,
            opacity: 0,
            rotate: p.rotate,
          }}
          transition={{ duration: 1.6 + Math.random(), delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}