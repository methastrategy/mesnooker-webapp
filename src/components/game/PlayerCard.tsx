"use client";

import { motion } from "framer-motion";
import { Crosshair } from "lucide-react";
import type { Player } from "@/types";
import { AnimatedNumber, Badge } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { cn } from "@/lib/utils";

export function PlayerCard({
  player,
  points,
  money,
  isShooter,
  targetName,
  isHolder,
  breakValue,
  rank,
}: {
  player: Player;
  points: number;
  money: number;
  isShooter: boolean;
  targetName?: string;
  isHolder?: boolean;
  breakValue?: number;
  rank?: number;
}) {
  const moneyColor = money === 0 ? "text-muted-foreground" : money > 0 ? "text-primary" : "text-destructive";
  return (
    <motion.div
      layout
      className={cn(
        "glass p-3.5 transition-all",
        isShooter && "ring-2 ring-primary glow-emerald bg-white/[0.07]"
      )}
    >
      <div className="flex items-center gap-3">
        <AvatarBubble avatar={player.avatar} size={30} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">{player.nickname}</span>
            {rank !== undefined && rank === 1 && <Badge variant="gold">#1</Badge>}
            {isShooter && <Badge>NOW</Badge>}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Crosshair size={10} />
            <span className="truncate">target: {targetName ?? "—"}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tabular-nums">
            <AnimatedNumber value={points} />
          </div>
          <div className={cn("text-[13px] font-semibold tabular-nums", moneyColor)}>
            {money > 0 ? "+" : ""}
            <AnimatedNumber value={money} prefix="฿" decimals={0} />
          </div>
        </div>
      </div>
      {isHolder && breakValue !== undefined && breakValue > 0 && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-gold/10 px-2 py-0.5 text-[11px] text-gold">
          Break {breakValue}
        </div>
      )}
    </motion.div>
  );
}