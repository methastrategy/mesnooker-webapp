"use client";

import { motion } from "framer-motion";
import { Wallet } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5">
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_0_30px_rgba(22,199,132,0.4)]"
      >
        <Wallet size={30} />
      </motion.div>
      <div className="text-center">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="text-base font-bold"
        >
          Snooker Money Tracker
        </motion.div>
        <div className="mt-1 text-[10px] uppercase tracking-widest text-gold">
          Loading
        </div>
      </div>
    </div>
  );
}