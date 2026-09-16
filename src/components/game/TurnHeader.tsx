"use client";

import { motion } from "framer-motion";
import { Timer, Hourglass } from "lucide-react";
import type { Player } from "@/types";
import { AnimatedNumber, Badge } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { cn } from "@/lib/utils";

/** Compact shooter identity + live break count + running money + clocks.
 *  Replaces the previous separate shooter-header and clocks bars so the
 *  money figure is always in view mid-play. */
export function TurnHeader({
  shooter,
  targetName,
  breakCount,
  runningMoney,
  isClearing,
  clearingLabel,
}: {
  shooter: Player;
  targetName?: string;
  breakCount: number;
  runningMoney: number;
  isClearing?: boolean;
  clearingLabel?: string;
}) {
  const moneyColor = runningMoney === 0 ? "text-muted-foreground" : runningMoney > 0 ? "text-primary" : "text-destructive";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glow-emerald flex items-center gap-3 p-3 md:p-4"
    >
      <AvatarBubble avatar={shooter.avatar} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-bold text-base md:text-lg">{shooter.nickname}</span>
          <Badge variant={isClearing ? "gold" : "default"}>
            {isClearing ? `CLEAR: ${clearingLabel ?? "..."}` : "ON BREAK"}
          </Badge>
        </div>
        <div className="text-[11px] text-muted-foreground">
          {targetName ? `vs ${targetName}` : "next to shoot"}
        </div>
      </div>

      {/* running money — always visible */}
      <div className="text-right leading-tight">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Money</div>
        <div className={cn("text-xl md:text-2xl font-bold tabular-nums", moneyColor)}>
          {runningMoney > 0 ? "+" : ""}
          <AnimatedNumber value={runningMoney} prefix="฿" decimals={0} />
        </div>
      </div>

      <div className="text-right leading-tight pl-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Break</div>
        <div className="text-xl md:text-2xl font-bold tabular-nums text-gold">
          <AnimatedNumber value={breakCount} />
        </div>
      </div>
    </motion.div>
  );
}

/** Live clocks + frame step strip — merged into the header row on ≥lg */
export function ClockStrip({
  frameNumber,
  frameClock,
  sessionClock,
}: {
  frameNumber: number;
  frameClock: string;
  sessionClock: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-1 text-[11px] md:text-[12px] tabular-nums">
      <span className="flex items-center gap-1.5 text-foreground/80">
        <Timer className="text-primary" size={13} /> Frame {frameNumber}: {frameClock}
      </span>
      <span className="flex items-center gap-1.5 text-foreground/60">
        <Hourglass className="text-gold" size={13} /> Session: {sessionClock}
      </span>
    </div>
  );
}