"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Bottom sheet drawer (mobile-bottom / desktop-right) */
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
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              "fixed z-50 glass-strong flex flex-col",
              side === "bottom"
                ? "inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl pb-safe"
                : "top-0 right-0 h-full w-full max-w-md rounded-l-3xl"
            )}
            initial={side === "bottom" ? { y: "100%" } : { x: "100%" }}
            animate={side === "bottom" ? { y: 0 } : { x: 0 }}
            exit={side === "bottom" ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-base font-semibold">{title}</h3>
              <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}