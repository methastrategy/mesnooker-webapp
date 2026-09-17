"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Tone = "info" | "success" | "danger";

const TONE_ICON = { info: "↳", success: "+", danger: "!" } as Record<Tone, string>;
const TONE_CLS = {
  info: "border-white/15 bg-white/8 text-foreground",
  success: "border-primary/40 bg-primary/15 text-primary",
  danger: "border-destructive/50 bg-destructive/15 text-destructive",
} as Record<Tone, string>;

/** Transient bottom toast — flashes clearly when an action is pressed, then
 *  auto-dismisses. Pushed into the corner-of-eye so the operator always sees
 *  the consequence (e.g. "Foul −4 → next: Player 2") without blocking input. */
export function ActionToast({
  message,
  tone = "info",
  duration = 1600,
  onDone,
}: {
  message: string;
  tone?: Tone;
  duration?: number;
  onDone?: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onDone?.(), duration);
    return () => clearTimeout(t);
  }, [message, duration, onDone]);

  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className={`pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${TONE_CLS[tone]}`}
          role="status"
          aria-live="polite"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
            {TONE_ICON[tone]}
          </span>
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}