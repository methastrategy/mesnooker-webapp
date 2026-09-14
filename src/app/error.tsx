"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
      <motion.span
        initial={{ rotate: -8, scale: 0.9 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/15 text-destructive"
      >
        <AlertTriangle size={28} />
      </motion.span>
      <div>
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-1 max-w-sm break-all text-sm text-destructive">
          {error?.message || error?.digest || "Unknown error"}
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          An unexpected error interrupted this view. Your data is safe — try reloading.
        </p>
      </div>
      <Button onClick={reset}>
        <RefreshCcw size={16} /> Try again
      </Button>
    </div>
  );
}