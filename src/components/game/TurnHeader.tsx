"use client";

import { motion } from "framer-motion";
import { Timer, Hourglass, ArrowRight, Zap } from "lucide-react";
import type { Player } from "@/types";
import { AnimatedNumber, Badge } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { cn } from "@/lib/utils";

import { useGameStore } from "@/store/gameStore";
import { t } from "@/lib/i18n";

/** Compact shooter identity + live break count + running money + clocks.
 *  Now includes a "Up Next" player queue strip showing who shoots after. */
export function TurnHeader({
  shooter,
  targetName,
  breakCount,
  runningMoney,
  isClearing,
  clearingLabel,
  players,
  shooterIndex,
  reverse,
}: {
  shooter: Player;
  targetName?: string;
  breakCount: number;
  runningMoney: number;
  isClearing?: boolean;
  clearingLabel?: string;
  /** Full player list — used to render the "Up Next" queue */
  players?: Player[];
  shooterIndex?: number;
  reverse?: boolean;
}) {
  const locale = useGameStore((s) => s.locale);

  const moneyColor =
    runningMoney === 0
      ? "text-muted-foreground"
      : runningMoney > 0
        ? "text-primary"
        : "text-destructive";

  // Build "up next" queue: next 2 players after the shooter
  const queue: Player[] = [];
  if (players && players.length > 1 && shooterIndex !== undefined) {
    const n = players.length;
    for (let step = 1; step <= Math.min(2, n - 1); step++) {
      const idx = reverse
        ? (shooterIndex - step + n) % n
        : (shooterIndex + step) % n;
      queue.push(players[idx]);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glow-emerald flex flex-col gap-0 overflow-hidden"
    >
      {/* Main shooter row */}
      <div className="flex items-center gap-3 p-3 md:p-4">
        {/* Avatar with active glow ring */}
        <div className="relative shrink-0">
          <div className="absolute -inset-1 rounded-full bg-primary/30 blur-sm" />
          <AvatarBubble avatar={shooter.avatar} size={44} />
          {/* Active shooter pulse dot */}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-black bg-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-bold text-base md:text-lg leading-tight">
              {shooter.nickname}
            </span>
            <Badge variant={isClearing ? "gold" : "default"} className="shrink-0">
              {isClearing ? `🎯 CLEAR: ${clearingLabel ?? "..."}` : "🎱 ON BREAK"}
            </Badge>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {targetName ? (
              <span>
                vs{" "}
                <span className="font-semibold text-foreground/70">{targetName}</span>
              </span>
            ) : (
              t("match.currentShooter", locale)
            )}
          </div>
        </div>

        {/* Stats cluster: money + break */}
        <div className="flex items-center gap-3">
          {/* Running money */}
          <div className="text-right leading-tight">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">฿ Money</div>
            <div className={cn("text-xl md:text-2xl font-bold tabular-nums", moneyColor)}>
              {runningMoney > 0 ? "+" : ""}
              <AnimatedNumber value={runningMoney} prefix="฿" decimals={0} />
            </div>
          </div>
          {/* Break count */}
          <div className="text-right leading-tight pl-2 border-l border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 justify-end">
              <Zap size={9} className="text-gold" />Break
            </div>
            <div className="text-xl md:text-2xl font-bold tabular-nums text-gold">
              <AnimatedNumber value={breakCount} />
            </div>
          </div>
        </div>
      </div>

      {/* Up Next queue strip — only show when >1 players */}
      {queue.length > 0 && (
        <div className="flex items-center gap-2 border-t border-white/[0.07] bg-white/[0.02] px-4 py-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
            {t("match.upNext", locale)}
          </span>
          <div className="flex items-center gap-1.5">
            {queue.map((p, i) => (
              <div key={p.id} className="flex items-center gap-1">
                {i > 0 && <ArrowRight size={10} className="text-white/20" />}
                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5">
                  <AvatarBubble avatar={p.avatar} size={14} />
                  <span className="text-[11px] font-medium text-foreground/70 leading-none">
                    {p.nickname}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {reverse && (
            <span className="ml-auto text-[10px] text-muted-foreground/60 shrink-0">↩ {locale === "th" ? "ย้อนคิว" : "reversed"}</span>
          )}
        </div>
      )}
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
  const locale = useGameStore((s) => s.locale);

  return (
    <div className="flex items-center justify-between gap-2 px-1 text-[11px] md:text-[12px] tabular-nums">
      <span className="flex items-center gap-1.5 text-foreground/80">
        <Timer className="text-primary" size={13} /> {t("dash.frame", locale)} {frameNumber}: {frameClock}
      </span>
      <span className="flex items-center gap-1.5 text-foreground/60">
        <Hourglass className="text-gold" size={13} /> Session: {sessionClock}
      </span>
    </div>
  );
}