"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, SearchX } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="text-7xl font-black tracking-tight text-primary"
        style={{ textShadow: "0 0 40px rgba(22,199,132,0.4)" }}
      >
        404
      </motion.div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <SearchX size={16} /> Nothing found on this table.
      </div>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you're looking for doesn't exist or has been moved. Head back to the dashboard.
      </p>
      <Link href="/">
        <Button>
          <Home size={16} /> Back home
        </Button>
      </Link>
    </div>
  );
}