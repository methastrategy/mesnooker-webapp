"use client";

import { useScroll, useMotionValueEvent } from "framer-motion";
import * as React from "react";
import { Timer, ArrowRight, Zap, Trophy } from "lucide-react";
import type { Player } from "@/types";
import { AnimatedNumber } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/gameStore";
import { t } from "@/lib/i18n";

export interface TurnHeaderProps {
  shooter: Player;
  targetName?: string;
  breakCount: number;
  runningMoney: number;
  isClearing?: boolean;
  clearingLabel?: string;
  players?: Player[];
  shooterIndex?: number;
  reverse?: boolean;
  /** Live frame scores per player */
  scores?: Record<string, number>;
  /** Net running money per player */
  runningBalances?: Record<string, number>;
  /** Break starting phase indicator */
  canStartBreak?: boolean;
  /** Clocks */
  frameClock?: string;
  sessionClock?: string;
  frameNumber?: number;
}

/**
 * Top Match Header — Rock-Solid Mobile Stability:
 * Fixed, predictable height to eliminate scroll oscillation and jumping windows.
 * 1. TOP: Live Player Scoreboard cards (immediate feedback on every ball/foul tap).
 * 2. SUB-ROW: Current Shooter break status + Up-Next player queue + live clocks.
 */
export function TurnHeader({
  shooter,
  targetName,
  breakCount,
  runningMoney,
  isClearing,
  clearingLabel,
  players = [],
  shooterIndex,
  reverse,
  scores = {},
  runningBalances = {},
  canStartBreak,
  frameClock,
  sessionClock,
  frameNumber = 1,
}: TurnHeaderProps) {
  const locale = useGameStore((s) => s.locale);

  // Determine top score for leader badge
  const maxScore = Math.max(0, ...players.map((p) => scores[p.id] ?? 0));

  // Build "up next" queue: next players in rotation after the current shooter
  const queue: Player[] = [];
  if (players.length > 1 && shooterIndex !== undefined) {
    const n = players.length;
    for (let step = 1; step <= Math.min(2, n - 1); step++) {
      const idx = reverse
        ? (shooterIndex - step + n) % n
        : (shooterIndex + step) % n;
      queue.push(players[idx]);
    }
  }

  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = React.useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  return (
    <div
      className={cn(
        "sticky top-0 z-30 flex flex-col gap-1.5 pb-2 bg-background/95 backdrop-blur-md pt-safe border-b transition-colors duration-150",
        isScrolled ? "border-border shadow-xs" : "border-transparent"
      )}
    >
      {/* ═════════════ 1. LIVE SCOREBOARD CARDS (TOPMOST) ═════════════ */}
      <div
        className={cn(
          "grid gap-1.5 sm:gap-2",
          players.length <= 2
            ? "grid-cols-2"
            : players.length === 3
              ? "grid-cols-2 sm:grid-cols-3"
              : "grid-cols-2 sm:grid-cols-4"
        )}
      >
        {players.map((p) => {
          const isShooting = p.id === shooter.id;
          const score = scores[p.id] ?? 0;
          const bal = runningBalances[p.id] ?? (isShooting ? runningMoney : 0);
          const isLeading = maxScore > 0 && score === maxScore;

          const balColor =
            bal === 0
              ? "text-muted-foreground"
              : bal > 0
                ? "text-primary"
                : "text-destructive";

          return (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col justify-between rounded-[8px] border p-2 sm:p-2.5 transition-colors",
                isShooting
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card opacity-90 hover:opacity-100"
              )}
            >
              {/* Player Top Line: Avatar + Name + Badges */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="relative shrink-0">
                    <AvatarBubble avatar={p.avatar} size={20} />
                    {isShooting && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2 items-center justify-center rounded-full bg-primary">
                        <span className="h-1 w-1 rounded-full bg-black" />
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "truncate font-semibold tracking-tight text-xs leading-tight",
                      isShooting ? "text-foreground" : "text-[#d3d3d4]"
                    )}
                  >
                    {p.nickname}
                  </span>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1 shrink-0">
                  {isLeading && (
                    <span className="flex items-center gap-0.5 rounded-[4px] px-1 py-0.2 bg-gold/10 border border-gold/25 text-[9px] font-mono font-medium text-gold uppercase">
                      <Trophy size={9} />
                      <span>Lead</span>
                    </span>
                  )}
                  {isShooting && (
                    <span className="flex items-center gap-0.5 rounded-[4px] px-1 py-0.2 bg-primary/20 border border-primary/35 text-[9px] font-mono font-bold text-primary uppercase">
                      <Zap size={9} className="text-primary" />
                      <span>Turn</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Main Score Display */}
              <div className="flex items-baseline justify-between gap-2 my-0.5">
                <div className="font-mono font-bold tracking-tight text-foreground tabular-nums leading-none text-xl sm:text-2xl md:text-3xl">
                  <AnimatedNumber value={score} />
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider font-mono text-muted-foreground block leading-tight">
                    Money
                  </span>
                  <span className={cn("font-mono font-semibold tabular-nums text-xs sm:text-sm leading-none", balColor)}>
                    {bal > 0 ? "+" : ""}
                    <AnimatedNumber value={bal} prefix="฿" decimals={0} />
                  </span>
                </div>
              </div>

              {/* Active Shooter Break Subtext */}
              {isShooting && breakCount > 0 && (
                <div className="mt-0.5 flex items-center justify-between border-t border-border pt-0.5 text-[10px] font-mono">
                  <span className="text-[#d3d3d4]">Current Break</span>
                  <span className="font-bold text-gold">+{breakCount}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ═════════════ 2. SHOOTER & UP-NEXT QUEUE BAR (BELOW SCOREBOARD) ═════════════ */}
      <div className="flex items-center justify-between gap-1.5 rounded-[8px] border border-border bg-card px-2.5 py-1.5 text-xs">
        {/* Active Shooter Identity & Ball State */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="text-[#d3d3d4] text-[11px] font-medium shrink-0">
            {locale === "th" ? "คิวแทง:" : "Turn:"}
          </span>
          <span className="font-semibold text-foreground tracking-tight truncate text-xs">
            {shooter.nickname}
            {targetName && (
              <span className="text-muted-foreground font-normal text-[10px] ml-1 hidden xs:inline">
                vs {targetName}
              </span>
            )}
          </span>
          <span
            className={cn(
              "px-2 py-0.5 rounded-[6px] text-[10px] font-mono font-medium tracking-wide uppercase shrink-0",
              isClearing
                ? "bg-gold/15 text-gold border border-gold/30"
                : canStartBreak
                  ? "bg-primary/15 text-primary border border-primary/35"
                  : "bg-destructive/15 text-destructive border border-destructive/35"
            )}
          >
            {isClearing
              ? `🎯 CLEAR: ${clearingLabel ?? "..."}`
              : canStartBreak
                ? "● Any Colour"
                : "● Red First"}
          </span>
        </div>

        {/* Up-Next Queue & Live Clocks */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto text-[11px] font-mono shrink-0">
          {queue.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[#d3d3d4] hidden sm:inline">{locale === "th" ? "คิวถัดไป:" : "Next:"}</span>
              <div className="flex items-center gap-1">
                {queue.slice(0, 2).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-1">
                    {i > 0 && <ArrowRight size={10} className="text-muted-foreground" />}
                    <div className="flex items-center gap-1 rounded-[6px] bg-surface border border-border px-1.5 py-0.5 text-foreground">
                      <AvatarBubble avatar={p.avatar} size={12} />
                      <span className="text-[10px] font-medium max-w-[50px] sm:max-w-[70px] truncate">{p.nickname}</span>
                    </div>
                  </div>
                ))}
              </div>
              {reverse && (
                <span className="text-[10px] text-gold" title="Reversed rotation">
                  ↩
                </span>
              )}
            </div>
          )}

          {frameClock && (
            <div className="hidden md:flex items-center gap-1 pl-2 border-l border-border text-muted-foreground">
              <Timer size={12} className="text-primary" />
              <span>
                F{frameNumber}: {frameClock}
                {sessionClock && <span className="text-muted-foreground ml-1">· {sessionClock}</span>}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Standalone ClockStrip (backward compatibility) */
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
    <div className="flex items-center justify-between gap-2 px-1 text-[11px] md:text-[12px] tabular-nums font-mono">
      <span className="flex items-center gap-1.5 text-foreground/85">
        <Timer className="text-primary" size={13} /> {t("dash.frame", locale)} {frameNumber}: {frameClock}
      </span>
      {sessionClock && (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          Session: {sessionClock}
        </span>
      )}
    </div>
  );
}