"use client";

import * as React from "react";
import Link from "next/link";
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
 * Top Match Header — Asymmetric Scoreboard Podium:
 * 1. TOP: Active Shooter hero spotlight podium card with large tabular score.
 * 2. RIGHT/BELOW: Opponents challenger score tiles with rank badges.
 * 3. SUB-ROW: Current Shooter break status + Up-Next player queue + live clocks.
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
    for (let step = 1; step <= Math.min(3, n - 1); step++) {
      const idx = (shooterIndex + step) % n;
      queue.push(players[idx]);
    }
  }

  const opponents = players.filter((p) => p.id !== shooter.id);
  const shooterScore = scores[shooter?.id] ?? 0;
  const shooterBal = runningBalances[shooter?.id] ?? runningMoney;
  const isShooterLeading = maxScore > 0 && shooterScore === maxScore;

  const shooterBalColor =
    shooterBal === 0
      ? "text-muted-foreground"
      : shooterBal > 0
        ? "text-primary"
        : "text-destructive";

  return (
    <div className="flex flex-col gap-2.5 pb-1 select-none">
      {/* ═════════════ 1. ASYMMETRIC SCOREBOARD PODIUM ═════════════ */}
      <div
        className={cn(
          "grid gap-2.5 sm:gap-3",
          opponents.length > 0
            ? "grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
            : "grid-cols-1"
        )}
      >
        {/* ─── HERO ACTIVE SHOOTER PODIUM CARD ─── */}
        <div className="relative overflow-hidden rounded-[22px] border border-primary/30 bg-surface/85 backdrop-blur-xl p-4 sm:p-5 shadow-lg transition-all select-none">
          {/* Ambient Warm Spotlight Glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-primary/10 blur-3xl"
          />

          {/* Top Line: Avatar + Nickname + Matchup + Live Status Pills */}
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/player?id=${shooter.id}`}
              className="flex items-center gap-2.5 min-w-0 group hover:opacity-90 transition-opacity"
            >
              <div className="relative shrink-0">
                <AvatarBubble avatar={shooter.avatar} size={30} />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary ring-2 ring-card">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-base sm:text-lg font-black tracking-tight text-foreground leading-tight group-hover:text-primary transition-colors">
                    {shooter.nickname}
                  </span>
                  {isShooterLeading && (
                    <span className="flex items-center gap-1 rounded-full px-2 py-0.5 bg-gold/20 border border-gold/40 text-[9px] font-mono font-bold text-gold uppercase tracking-wider shadow-xs">
                      <Trophy size={10} />
                      <span className="hidden xs:inline">Leader</span>
                    </span>
                  )}
                </div>
                {targetName && (
                  <span className="text-[11px] font-mono text-muted-foreground truncate">
                    vs {targetName}
                  </span>
                )}
              </div>
            </Link>

            {/* Turn & Break Badges */}
            <div className="flex items-center gap-1.5 shrink-0">
              {breakCount > 0 && (
                <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 bg-gold/25 border border-gold/45 text-[10px] font-mono font-black text-gold uppercase tracking-widest shadow-xs animate-pulse">
                  <Zap size={11} className="fill-gold" />
                  <span>Break +{breakCount}</span>
                </span>
              )}
              <span className="flex items-center gap-1 rounded-full px-3 py-1 bg-primary text-primary-foreground text-[10px] font-mono font-black uppercase tracking-widest shadow-sm">
                <span>TURN</span>
              </span>
            </div>
          </div>

          {/* Center Line: Big Score + Net Money + Ball State Pill */}
          <div className="flex items-end justify-between gap-3 mt-3 pt-2 border-t border-primary/20">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Score
              </span>
              <div className="font-mono font-black tracking-tighter text-foreground tabular-nums leading-none text-4xl sm:text-5xl md:text-6xl">
                <AnimatedNumber value={shooterScore} />
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider font-mono text-muted-foreground block leading-tight">
                  Net Money
                </span>
                <span className={cn("font-mono font-black tabular-nums text-sm sm:text-lg leading-tight", shooterBalColor)}>
                  {shooterBal > 0 ? "+" : ""}
                  <AnimatedNumber value={shooterBal} prefix="฿" decimals={0} />
                </span>
              </div>

              {/* Legal Ball State Pill */}
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide uppercase shrink-0 shadow-xs",
                  isClearing
                    ? "bg-gold/20 text-gold border border-gold/35"
                    : canStartBreak
                      ? "bg-primary/20 text-primary border border-primary/35"
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
          </div>
        </div>

        {/* ─── CHALLENGERS & OPPONENTS STREAM ─── */}
        <div
          className={cn(
            "grid gap-2 sm:gap-2.5",
            opponents.length === 1
              ? "grid-cols-1"
              : opponents.length === 2
                ? "grid-cols-2"
                : "grid-cols-2 sm:grid-cols-3"
          )}
        >
          {opponents.map((p) => {
            const score = scores[p.id] ?? 0;
            const bal = runningBalances[p.id] ?? 0;
            const isLeading = maxScore > 0 && score === maxScore;
            const isNext = queue[0]?.id === p.id;

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
                  "relative flex flex-col justify-between rounded-2xl border p-3 sm:p-3.5 transition-all duration-150 select-none shadow-md backdrop-blur-md",
                  isNext
                    ? "border-primary/40 bg-surface/90 ring-1 ring-primary/20"
                    : "border-border/80 bg-surface/75 hover:border-primary/30"
                )}
              >
                {/* Top line: Avatar + Name + Badges */}
                <div className="flex items-center justify-between gap-1.5">
                  <Link
                    href={`/player?id=${p.id}`}
                    className="flex items-center gap-2 min-w-0 group hover:opacity-90 transition-opacity"
                  >
                    <AvatarBubble avatar={p.avatar} size={22} />
                    <span className="truncate font-bold tracking-tight text-xs sm:text-sm text-foreground/90 group-hover:text-primary transition-colors">
                      {p.nickname}
                    </span>
                  </Link>

                  <div className="flex items-center gap-1 shrink-0">
                    {isLeading && (
                      <span className="flex items-center gap-0.5 rounded-full px-1.5 py-0.2 bg-gold/15 border border-gold/30 text-[9px] font-mono font-bold text-gold uppercase tracking-wider">
                        <Trophy size={9} />
                      </span>
                    )}
                    {isNext && (
                      <span className="rounded-full px-2 py-0.2 bg-white/10 border border-white/20 text-[9px] font-mono font-bold text-foreground/80 uppercase tracking-wider">
                        Next
                      </span>
                    )}
                  </div>
                </div>

                {/* Score & Money */}
                <div className="flex items-baseline justify-between gap-2 mt-2 pt-1.5 border-t border-border/70">
                  <div className="font-mono font-black tracking-tight text-foreground tabular-nums text-2xl sm:text-3xl leading-none">
                    <AnimatedNumber value={score} />
                  </div>
                  <div className="text-right">
                    <span className={cn("font-mono font-bold tabular-nums text-xs sm:text-sm leading-none", balColor)}>
                      {bal > 0 ? "+" : ""}
                      <AnimatedNumber value={bal} prefix="฿" decimals={0} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═════════════ 2. STREAMLINED HUD STATUS & ROTATION RIBBON ═════════════ */}
      <div className="flex items-center justify-between gap-2 rounded-full border border-border/80 bg-card/85 px-3.5 sm:px-4 py-1.5 text-xs shadow-md backdrop-blur-md">
        {/* Rotation Queue Flow */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono min-w-0">
          <span className="text-muted-foreground uppercase tracking-wider shrink-0 text-[10px]">
            {locale === "th" ? "คิว:" : "Queue:"}
          </span>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {queue.map((p, i) => (
              <div key={p.id} className="flex items-center gap-1 shrink-0">
                {i > 0 && <ArrowRight size={10} className="text-muted-foreground/60" />}
                <div className="flex items-center gap-1 rounded-full bg-surface/90 border border-border/80 px-2 py-0.5 text-foreground shadow-xs">
                  <AvatarBubble avatar={p.avatar} size={12} />
                  <span className="text-[10px] font-medium max-w-[60px] truncate">{p.nickname}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Frame and Session Clocks */}
        {frameClock && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground shrink-0 pl-2 border-l border-border/80">
            <Timer size={12} className="text-primary shrink-0" />
            <span>
              F{frameNumber}: <strong className="text-foreground">{frameClock}</strong>
              {sessionClock && <span className="hidden sm:inline text-muted-foreground ml-1">· {sessionClock}</span>}
            </span>
          </div>
        )}
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