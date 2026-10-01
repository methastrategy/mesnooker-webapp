"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronsLeft,
  SkipForward,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui";

/** Turn controls: prev/next shooter, skip, undo */
export function TurnControls({
  onEndTurn,
  onPrev,
  onSkip,
  onUndo,
  canUndo,
}: {
  onEndTurn: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onUndo: () => void;
  canUndo: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="glass" size="sm" onClick={onPrev} aria-label="Previous shooter">
        <ArrowLeft size={16} />
      </Button>
      <Button onClick={onEndTurn} className="flex-1 sm:flex-none">
        <ArrowRight size={16} /> End turn
      </Button>
      <Button variant="ghost" size="sm" onClick={onSkip} aria-label="Skip player">
        <SkipForward size={16} />
      </Button>
      <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo} aria-label="Undo last action">
        <Undo2 size={16} />
      </Button>
      <Button variant="ghost" size="sm" onClick={onPrev} aria-label="Previous shooter" className="sm:hidden">
        <ChevronsLeft size={16} />
      </Button>
    </div>
  );
}

/** Small pulse dot showing active shooter */
export function ActivePulse({ active }: { active: boolean }) {
  return (
    <motion.span
      className="inline-block h-2 w-2 rounded-full bg-primary"
      animate={active ? { opacity: [1, 0.3, 1], scale: [1, 1.3, 1] } : { opacity: 0.3 }}
      transition={{ repeat: active ? Infinity : 0, duration: 1.4 }}
    />
  );
}