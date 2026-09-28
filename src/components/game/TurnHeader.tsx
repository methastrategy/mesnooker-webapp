"use client";

import { motion } from "framer-motion";
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
 * Top Match Header:
 * 1. TOP: Live Player Scoreboard cards (immediate visual feedback on every ball/foul tap).
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2"
    >
      {/* ═════════════ 1. LIVE SCOREBOARD CARDS (TOPMOST) ═════════════ */}
      <div
        className={cn(
          "grid gap-2",
          players.length <= 2
            ? "grid-cols-2"
            : players.length === 3
              ? "grid-cols-3"
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
              ? "text-zinc-500"
              : bal > 0
                ? "text-emerald-400"
                : "text-rose-400";

          return (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col justify-between rounded-xl p-2.5 sm:p-3 transition-all duration-200 border",
                isShooting
                  ? "border-[#3ecf8e] bg-[#16231d] ring-1 ring-[#3ecf8e]/40 shadow-[0_0_16px_rgba(62,207,142,0.18)]"
                  : "border-white/[0.08] bg-[#171717] opacity-85 hover:opacity-100"
              )}
            >
              {/* Player Top Line: Avatar + Name + Badges */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="relative shrink-0">
                    <AvatarBubble avatar={p.avatar} size={22} />
                    {isShooting && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2 items-center justify-center rounded-full bg-[#3ecf8e]">
                        <span className="h-1 w-1 rounded-full bg-black" />
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "truncate text-xs sm:text-sm font-semibold tracking-tight leading-tight",
                      isShooting ? "text-white" : "text-zinc-400"
                    )}
                  >
                    {p.nickname}
                  </span>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1 shrink-0">
                  {isLeading && (
                    <span className="flex items-center gap-0.5 rounded px-1 py-0.2 bg-amber-400/10 border border-amber-400/25 text-[9px] font-mono font-medium text-amber-300 uppercase">
                      <Trophy size={9} />
                      Lead
                    </span>
                  )}
                  {isShooting && (
                    <span className="flex items-center gap-0.5 rounded px-1 py-0.2 bg-[#3ecf8e]/20 border border-[#3ecf8e]/35 text-[9px] font-mono font-bold text-[#3ecf8e] uppercase">
                      <Zap size={9} className="text-[#3ecf8e]" />
                      Turn
                    </span>
                  )}
                </div>
              </div>

              {/* Main Score Display */}
              <div className="my-1 flex items-baseline justify-between gap-2">
                <div className="font-mono text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white tabular-nums leading-none">
                  <AnimatedNumber value={score} />
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 block leading-tight">
                    Money
                  </span>
                  <span className={cn("text-xs sm:text-sm font-mono font-medium tabular-nums leading-none", balColor)}>
                    {bal > 0 ? "+" : ""}
                    <AnimatedNumber value={bal} prefix="฿" decimals={0} />
                  </span>
                </div>
              </div>

              {/* Active Shooter Break Subtext */}
              {isShooting && breakCount > 0 && (
                <div className="mt-0.5 flex items-center justify-between border-t border-white/[0.06] pt-1 text-[10px] font-mono">
                  <span className="text-zinc-400">Current Break</span>
                  <span className="font-bold text-amber-300">+{breakCount}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ═════════════ 2. SHOOTER & UP-NEXT QUEUE BAR (BELOW SCOREBOARD) ═════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-[#171717] px-3 py-2 text-xs">
        {/* Active Shooter Identity & Ball State */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-zinc-500 text-[11px] font-medium shrink-0">
            {locale === "th" ? "คิวแทง:" : "Turn:"}
          </span>
          <span className="font-semibold text-white tracking-tight truncate">
            {shooter.nickname}
            {targetName && (
              <span className="text-zinc-500 font-normal text-[10px] ml-1">
                vs {targetName}
              </span>
            )}
          </span>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wide uppercase shrink-0",
              isClearing
                ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                : canStartBreak
                  ? "bg-[#3ecf8e]/15 text-[#3ecf8e] border border-[#3ecf8e]/35"
                  : "bg-rose-500/15 text-rose-300 border border-rose-500/35"
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
        <div className="flex items-center gap-3 ml-auto text-[11px] font-mono text-zinc-400">
          {queue.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">{locale === "th" ? "คิวถัดไป:" : "Next:"}</span>
              <div className="flex items-center gap-1">
                {queue.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-1">
                    {i > 0 && <ArrowRight size={10} className="text-zinc-600" />}
                    <div className="flex items-center gap-1 rounded bg-white/[0.04] border border-white/[0.07] px-1.5 py-0.5 text-zinc-300">
                      <AvatarBubble avatar={p.avatar} size={13} />
                      <span className="text-[10px] font-medium">{p.nickname}</span>
                    </div>
                  </div>
                ))}
              </div>
              {reverse && (
                <span className="text-[10px] text-amber-400/80" title="Reversed rotation">
                  ↩
                </span>
              )}
            </div>
          )}

          {frameClock && (
            <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-white/[0.08] text-zinc-400">
              <Timer size={12} className="text-[#3ecf8e]" />
              <span>
                F{frameNumber}: {frameClock}
                {sessionClock && <span className="text-zinc-500 ml-1">· {sessionClock}</span>}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
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
      <span className="flex items-center gap-1.5 text-zinc-300">
        <Timer className="text-[#3ecf8e]" size={13} /> {t("dash.frame", locale)} {frameNumber}: {frameClock}
      </span>
      {sessionClock && (
        <span className="flex items-center gap-1.5 text-zinc-400">
          Session: {sessionClock}
        </span>
      )}
    </div>
  );
}