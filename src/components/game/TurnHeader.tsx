"use client";

import * as React from "react";
import Link from "next/link";
import { Timer, ArrowRight, Zap, Trophy, Coins, SunMedium } from "lucide-react";
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
  /** Target cycle mapping: playerId -> targetPlayerId (target pays player on score) */
  targetCycle?: Record<string, string>;
  /** Screen Wake Lock active state */
  wakeLockActive?: boolean;
}

/**
 * Top Match Header — Asymmetric Scoreboard Podium:
 * 1. TOP: Active Shooter hero spotlight podium card with large tabular score & turn stakes.
 * 2. RIGHT/BELOW: Opponents challenger score tiles with rank & payout role badges (balanced 3-col on mobile).
 * 3. SUB-ROW 1: Dedicated Target Cycle Bar showing closed-loop payment flow (ใครจ่ายใคร).
 * 4. SUB-ROW 2: Up-Next rotation queue + Screen Wake Lock status + live clocks.
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
  targetCycle,
  wakeLockActive,
}: TurnHeaderProps) {
  const locale = useGameStore((s) => s.locale);

  // Target cycle mapping (fallback to standard (i-1+n)%n if not provided)
  const cycle: Record<string, string> = React.useMemo(() => {
    if (targetCycle && Object.keys(targetCycle).length > 0) return targetCycle;
    if (!players || players.length < 2) return {};
    const n = players.length;
    const res: Record<string, string> = {};
    players.forEach((p, i) => {
      res[p.id] = players[(i - 1 + n) % n].id;
    });
    return res;
  }, [targetCycle, players]);

  // Target player (who pays shooter on score)
  const shooterTargetId = cycle[shooter?.id];
  const shooterTarget = players.find((p) => p.id === shooterTargetId);

  // Payer player (who shooter pays when that player scores)
  const shooterPayer = players.find((p) => cycle[p.id] === shooter?.id);

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
    <div className="flex flex-col gap-2 sm:gap-2.5 pb-1 select-none">
      {/* ═════════════ 1. ASYMMETRIC SCOREBOARD PODIUM ═════════════ */}
      <div
        className={cn(
          "grid gap-2 sm:gap-2.5",
          opponents.length === 1
            ? "grid-cols-2"
            : opponents.length > 0
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
              : "grid-cols-1"
        )}
      >
        {/* ─── HERO ACTIVE SHOOTER PODIUM CARD ─── */}
        <div className="relative overflow-hidden rounded-[20px] sm:rounded-[22px] border border-primary/35 bg-surface/90 backdrop-blur-xl p-2.5 sm:p-4 shadow-lg transition-all select-none">
          {/* Ambient Warm Spotlight Glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/10 blur-2xl"
          />

          {/* Top Line: Avatar + Nickname + Matchup / Stakes + Turn Badges */}
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

                {/* Clear Turn Stakes Indicator (ใครจ่ายเรา / เราจ่ายใคร) */}
                {shooterTarget ? (
                  <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono mt-0.5">
                    <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                      <span>🎯 {locale === "th" ? (players.length === 2 ? "คู่แข่ง" : "เป้าเรา") : "Target"}:</span>
                      <strong className="text-foreground">{shooterTarget.nickname}</strong>
                      <span className="text-[9px] text-muted-foreground hidden min-[400px]:inline">
                        {locale === "th" ? "(คนจ่าย)" : "(pays)"}
                      </span>
                    </span>
                    {shooterPayer && players.length > 2 && shooterPayer.id !== shooterTarget.id && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 font-medium">
                        <span>🛡️ {locale === "th" ? "คนกินเรา" : "Hunts us"}:</span>
                        <strong className="text-foreground">{shooterPayer.nickname}</strong>
                        <span className="text-[9px] text-muted-foreground hidden min-[400px]:inline">
                          {locale === "th" ? "(ตาเขา)" : "(next)"}
                        </span>
                      </span>
                    )}
                  </div>
                ) : targetName ? (
                  <span className="text-[11px] font-mono text-muted-foreground truncate">
                    vs {targetName}
                  </span>
                ) : null}
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
          <div className="flex items-end justify-between gap-2 mt-2 pt-1.5 border-t border-primary/20">
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Score
              </span>
              <div className="font-mono font-black tracking-tighter text-foreground tabular-nums leading-none text-3xl min-[380px]:text-4xl sm:text-5xl md:text-6xl">
                <AnimatedNumber value={shooterScore} />
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="text-right">
                <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-mono text-muted-foreground block leading-tight">
                  Net Money
                </span>
                <span className={cn("font-mono font-black tabular-nums text-xs sm:text-base leading-tight", shooterBalColor)}>
                  {shooterBal > 0 ? "+" : ""}
                  <AnimatedNumber value={shooterBal} prefix="฿" decimals={0} />
                </span>
              </div>

              {/* Legal Ball State Pill */}
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold tracking-wide uppercase shrink-0 shadow-xs",
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
                    ? "● Colour"
                    : "● Red 1st"}
              </span>
            </div>
          </div>
        </div>

        {/* ─── CHALLENGERS & OPPONENTS STREAM ─── */}
        {/* Balanced 3-column layout on mobile for 3 opponents in 4-player match */}
        <div
          className={cn(
            "grid gap-1.5 sm:gap-2.5",
            opponents.length === 1
              ? "grid-cols-1"
              : opponents.length === 2
                ? "grid-cols-2"
                : opponents.length === 3
                  ? "grid-cols-3"
                  : "grid-cols-2 sm:grid-cols-4"
          )}
        >
          {opponents.map((p) => {
            const score = scores[p.id] ?? 0;
            const bal = runningBalances[p.id] ?? 0;
            const isLeading = maxScore > 0 && score === maxScore;
            const isNext = queue[0]?.id === p.id;
            const isTargetOfShooter = p.id === shooterTarget?.id;

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
                  "relative flex flex-col justify-between rounded-[16px] sm:rounded-2xl border p-1.5 min-[380px]:p-2 sm:p-2.5 transition-all duration-150 select-none shadow-md backdrop-blur-md overflow-hidden",
                  isTargetOfShooter
                    ? "border-emerald-500/45 bg-emerald-950/20 ring-1 ring-emerald-500/30 shadow-xs"
                    : isNext
                      ? "border-primary/45 bg-primary/10 ring-1 ring-primary/30 shadow-xs"
                      : "border-border/80 bg-surface/75 hover:border-primary/30"
                )}
              >
                {/* Top line: Avatar + Name + Single prioritized badge */}
                <div className="flex items-center justify-between gap-1 min-w-0">
                  <Link
                    href={`/player?id=${p.id}`}
                    className="flex items-center gap-1 min-[380px]:gap-1.5 min-w-0 flex-1 group hover:opacity-90 transition-opacity"
                  >
                    <AvatarBubble avatar={p.avatar} size={18} />
                    <span className="truncate font-bold tracking-tight text-[11px] sm:text-xs text-foreground/90 group-hover:text-primary transition-colors">
                      {p.nickname}
                    </span>
                  </Link>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {/* Prioritized Role Badge: Target > Next > Leader */}
                    {isTargetOfShooter ? (
                      <span
                        className="rounded-full px-1.5 py-0.2 bg-emerald-500/25 border border-emerald-500/50 text-[8px] sm:text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wide shrink-0 shadow-xs"
                        title={locale === "th" ? "เป้าหมาย: จ่ายเงินเมื่อคุณตบลง" : "Target: pays turn shooter"}
                      >
                        {locale === "th" ? "🎯 เป้า" : "Target"}
                      </span>
                    ) : isNext ? (
                      <span
                        className="rounded-full px-1.5 py-0.2 bg-primary/20 border border-primary/40 text-[8px] sm:text-[9px] font-mono font-bold text-primary uppercase tracking-wide shrink-0 shadow-xs"
                        title={locale === "th" ? "คิวถัดไป" : "Next shooter"}
                      >
                        Next
                      </span>
                    ) : isLeading ? (
                      <span
                        className="flex items-center gap-0.5 rounded-full px-1 py-0.2 bg-gold/15 border border-gold/30 text-[8px] sm:text-[9px] font-mono font-bold text-gold uppercase tracking-wider shrink-0"
                        title={locale === "th" ? "ผู้นำเฟรม" : "Leader"}
                      >
                        <Trophy size={8} />
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Score & Money */}
                <div className="flex items-baseline justify-between gap-1 mt-1.5 pt-1 border-t border-border/70">
                  <div className="flex items-baseline gap-1 min-w-0">
                    <span className="font-mono font-black tracking-tight text-foreground tabular-nums text-xl min-[380px]:text-2xl sm:text-3xl leading-none">
                      <AnimatedNumber value={score} />
                    </span>
                    {/* Leader trophy icon if player already has Target or Next badge */}
                    {isLeading && (isTargetOfShooter || isNext) && (
                      <Trophy size={10} className="text-gold shrink-0 self-center" />
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={cn("font-mono font-bold tabular-nums text-[10px] min-[380px]:text-xs sm:text-sm leading-none", balColor)}>
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

      {/* ═════════════ 2. TARGET CYCLE RIBBON (แถบแสดงใครจ่ายใคร) ═════════════ */}
      {players.length >= 2 && (
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 rounded-2xl border border-gold/30 bg-surface/90 px-2.5 sm:px-3.5 py-1 text-xs shadow-md backdrop-blur-md overflow-hidden">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-1 shrink-0 text-gold font-mono font-bold text-[10px] uppercase tracking-wider pr-1">
              <Coins size={12} className="text-gold shrink-0" />
              <span>{locale === "th" ? "ใครจ่ายใคร:" : "Target Cycle:"}</span>
            </div>

            {players.length === 2 ? (
              /* 2-Player Head-to-Head Flow */
              <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono">
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 font-medium shadow-xs shrink-0",
                    players[0].id === shooter.id
                      ? "bg-primary text-primary-foreground font-bold ring-1 ring-primary/40"
                      : "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-semibold"
                  )}
                >
                  <AvatarBubble avatar={players[0].avatar} size={12} />
                  <span className="max-w-[70px] truncate">{players[0].nickname}</span>
                  {players[0].id === shooter.id && (
                    <span className="text-[8px] uppercase tracking-wider ml-0.5 font-bold opacity-90">
                      {locale === "th" ? "(แทง)" : "(Turn)"}
                    </span>
                  )}
                </div>

                <span className="flex items-center gap-0.5 text-[9px] font-mono text-gold shrink-0 px-1 font-bold">
                  <span>⇄</span>
                  <span>{locale === "th" ? "ผลัดกันจ่ายตามแต้ม" : "head-to-head"}</span>
                  <span>⇄</span>
                </span>

                <div
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 font-medium shadow-xs shrink-0",
                    players[1].id === shooter.id
                      ? "bg-primary text-primary-foreground font-bold ring-1 ring-primary/40"
                      : "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-semibold"
                  )}
                >
                  <AvatarBubble avatar={players[1].avatar} size={12} />
                  <span className="max-w-[70px] truncate">{players[1].nickname}</span>
                  {players[1].id === shooter.id && (
                    <span className="text-[8px] uppercase tracking-wider ml-0.5 font-bold opacity-90">
                      {locale === "th" ? "(แทง)" : "(Turn)"}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* 3+ Players Circular Payment Chain */
              <div className="flex items-center gap-1 shrink-0">
                {players.map((p, idx) => {
                  const isShooter = p.id === shooter.id;
                  const isTarget = p.id === shooterTarget?.id;
                  const prevPlayer = players[(idx - 1 + players.length) % players.length];
                  // Link where target pays shooter
                  const isTurnPaymentLink = p.id === shooter.id && prevPlayer.id === shooterTarget?.id;

                  return (
                    <React.Fragment key={p.id}>
                      {idx > 0 && (
                        <span
                          className={cn(
                            "flex items-center gap-0.5 text-[9px] font-mono shrink-0 px-0.5 transition-colors",
                            isTurnPaymentLink
                              ? "text-emerald-400 font-bold"
                              : "text-muted-foreground/80"
                          )}
                        >
                          <span>{locale === "th" ? (isTurnPaymentLink ? "จ่ายตานี้" : "จ่าย") : (isTurnPaymentLink ? "pays now" : "pays")}</span>
                          <ArrowRight size={9} className={isTurnPaymentLink ? "text-emerald-400" : "text-gold/70"} />
                        </span>
                      )}
                      <div
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all shadow-xs shrink-0",
                          isShooter
                            ? "bg-primary text-primary-foreground font-bold shadow-xs ring-1 ring-primary/40"
                            : isTarget
                              ? "bg-emerald-500/15 border border-emerald-500/45 text-emerald-400 font-semibold ring-1 ring-emerald-500/30"
                              : "bg-surface/90 border border-border/80 text-foreground"
                        )}
                      >
                        <AvatarBubble avatar={p.avatar} size={12} />
                        <span className="max-w-[65px] truncate">{p.nickname}</span>
                        {isShooter ? (
                          <span className="text-[8px] uppercase tracking-wider ml-0.5 opacity-90 font-bold">
                            {locale === "th" ? "(แทง)" : "(Turn)"}
                          </span>
                        ) : isTarget ? (
                          <span className="text-[8px] uppercase tracking-wider ml-0.5 text-emerald-400 font-bold">
                            {locale === "th" ? "(คนจ่าย)" : "(Pays)"}
                          </span>
                        ) : null}
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* Return arrow back to start of circle */}
                {(() => {
                  const lastPlayer = players[players.length - 1];
                  const firstPlayer = players[0];
                  const isReturnTurnPaymentLink = firstPlayer.id === shooter.id && lastPlayer.id === shooterTarget?.id;
                  return (
                    <span
                      className={cn(
                        "flex items-center gap-0.5 text-[9px] font-mono shrink-0 pl-1 transition-colors",
                        isReturnTurnPaymentLink
                          ? "text-emerald-400 font-bold"
                          : "text-muted-foreground/70"
                      )}
                    >
                      <span>{locale === "th" ? (isReturnTurnPaymentLink ? "จ่ายตานี้" : "จ่าย") : (isReturnTurnPaymentLink ? "pays now" : "pays")}</span>
                      <ArrowRight size={9} className={isReturnTurnPaymentLink ? "text-emerald-400" : "text-gold/50"} />
                      <span>↺</span>
                    </span>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Right side: Turn highlight summary (แสดงชัดเจนว่าตานี้ใครจ่ายใคร) */}
          {shooterTarget && (
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono shrink-0 pl-2 border-l border-border/80">
              <span className="text-muted-foreground">{locale === "th" ? "ตานี้:" : "Turn:"}</span>
              <span className="text-emerald-400 font-bold">
                {locale === "th"
                  ? `${shooterTarget.nickname} จ่าย ${shooter.nickname}`
                  : `${shooterTarget.nickname} pays ${shooter.nickname}`}
              </span>
              <span className="text-[9px] text-muted-foreground/80">
                {locale === "th" ? "(เป้าหมาย)" : "(Target)"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ═════════════ 3. STREAMLINED HUD STATUS & ROTATION RIBBON ═════════════ */}
      <div className="flex items-center justify-between gap-2 rounded-full border border-border/80 bg-card/85 px-3 sm:px-4 py-1 text-xs shadow-md backdrop-blur-md">
        {/* Rotation Queue Flow */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono min-w-0">
          <span className="text-muted-foreground uppercase tracking-wider shrink-0 text-[10px]">
            {locale === "th" ? "คิวถัดไป:" : "Up Next:"}
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

        {/* Right side: Wake Lock Indicator + Live Clocks */}
        <div className="flex items-center gap-2 shrink-0">
          {wakeLockActive && (
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 bg-amber-500/15 border border-amber-500/35 text-[9px] font-mono font-bold text-amber-400 shadow-xs"
              title="Screen Wake Lock Active (หน้าจอสว่างตลอดการแข่งขัน)"
            >
              <SunMedium size={10} className="text-amber-400 animate-pulse" />
              <span>{locale === "th" ? "จอตื่น" : "WakeLock"}</span>
            </span>
          )}

          {frameClock && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground shrink-0 pl-1.5 sm:pl-2 border-l border-border/80">
              <Timer size={12} className="text-primary shrink-0" />
              <span>
                F{frameNumber}: <strong className="text-foreground">{frameClock}</strong>
                {sessionClock && <span className="hidden sm:inline text-muted-foreground ml-1">· {sessionClock}</span>}
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