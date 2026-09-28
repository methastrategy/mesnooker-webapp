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
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        />
      )}
      {open && (
        <motion.div
          className={cn(
            "fixed z-50 glass-strong flex flex-col",
            side === "bottom"
              ? "inset-x-0 bottom-0 max-h-[85vh] rounded-t-[12px] pb-safe"
              : "top-0 right-0 h-full w-full max-w-md rounded-l-[12px]"
          )}
          initial={side === "bottom" ? { y: "100%" } : { x: "100%" }}
          animate={side === "bottom" ? { y: 0 } : { x: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
        >
          <div className="flex items-center justify-between border-b border-border px-4 sm:px-5 py-3">
            <h3 className="text-sm sm:text-base font-semibold text-foreground">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[6px] border border-border bg-surface p-1.5 text-muted-foreground hover:bg-card hover:text-foreground transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-5 pt-3 pb-8">{children}</div>
        </motion.div>
      )}
    </>
  );
}