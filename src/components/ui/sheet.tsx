"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Bottom sheet drawer (mobile-bottom / desktop-right).
 *
 *  NOTE (2026-09): deliberately NOT wrapped in AnimatePresence. The exit pass
 *  of AnimatePresence keeps the fixed backdrop mounted at opacity 0 while it
 *  waits for a spring exit that may never fire on a client-side route swap —
 *  leaving an invisible full-screen click-eater that makes every tap "do
 *  nothing". Conditional render + entrance animation only: closing unmounts
 *  instantly, which is the reliable behaviour. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  side = "bottom",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: "bottom" | "right";
}) {
  return (
    <>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        />
      )}
      {open && (
        <motion.div
          className={cn(
            "fixed z-50 glass-strong flex flex-col border-border/80 shadow-2xl backdrop-blur-2xl",
            side === "bottom"
              ? "inset-x-0 bottom-0 max-h-[88vh] rounded-t-[24px] border-t pb-safe"
              : "top-0 right-0 h-full w-full max-w-md rounded-l-[24px] border-l"
          )}
          initial={side === "bottom" ? { y: "100%" } : { x: "100%" }}
          animate={side === "bottom" ? { y: 0 } : { x: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
        >
          {/* Mobile Top Drag Indicator */}
          {side === "bottom" && (
            <div className="mx-auto mt-2.5 mb-0.5 h-1 w-10 rounded-full bg-muted-foreground/35 shrink-0" />
          )}

          <div className="flex items-center justify-between border-b border-border/70 px-4 sm:px-6 py-3.5">
            <h3 className="text-sm sm:text-base font-bold text-foreground font-mono tracking-tight">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-surface/80 text-muted-foreground hover:bg-card hover:text-foreground transition-all cursor-pointer shadow-xs active:scale-90"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-6 pt-3 pb-8">{children}</div>
        </motion.div>
      )}
    </>
  );
}