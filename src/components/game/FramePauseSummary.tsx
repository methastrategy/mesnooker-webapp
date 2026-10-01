"use client";

import { motion } from "framer-motion";
import { Play, Flag, Trophy, Target, Coins, CheckCircle2, Award, Clock, RotateCcw } from "lucide-react";
import { useGameStore, useRunningBalance } from "@/store/gameStore";
import { Button, Badge } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { formatMoney, cn } from "@/lib/utils";
import { useElapsedSum } from "@/hooks/useElapsed";
import type { ArchivedGame } from "@/types";

/**
 * FramePauseSummary — Pro Command Cockpit Standard.
 * Rendered immediately after a frame ends (via "End frame" or black potted).
 * Features concentric squircle geometry, winner spotlight podium, tie-break handler,
 * interactive next-opener selector, live ledger, and accidental-end resume safety.
 */
export function FramePauseSummary({
  onFinish,
  onResume,
}: {
  onFinish: (a: ArchivedGame) => void;
  onResume?: () => void;
}) {
  const store = useGameStore();
  const running = useRunningBalance();
  const players = store.players;
  const frame = store.frames[store.frames.length - 1];

  const sessionClock = useElapsedSum(store.frames);
  const frameClock = useElapsedSum([frame].filter(Boolean));

  if (!store.session || !frame) return null;

  const sorted = [...players].sort(
    (a, b) => (frame.scores[b.id] ?? 0) - (frame.scores[a.id] ?? 0)
  );
  const frameTotal = players.reduce((s, p) => s + (frame.scores[p.id] ?? 0), 0);
  const maxScore = Math.max(0, ...players.map((x) => frame.scores[x.id] ?? 0));
  const winnerIds = players
    .filter((p) => (frame.scores[p.id] ?? 0) === maxScore && maxScore > 0)
    .map((p) => p.id);
  const isTie = winnerIds.length > 1;
  const frameWinner = winnerIds.length === 1 ? players.find((p) => p.id === winnerIds[0]) : null;
  const tiedWinners = isTie ? players.filter((p) => winnerIds.includes(p.id)) : [];

  // nextFrameFirstShooter: who opens next frame. Guaranteed fallback to next rotation player.
  const activeOpenerIdx =
    store.session.nextFrameFirstShooter !== undefined
      ? store.session.nextFrameFirstShooter
      : (store.shooterIndex + 1) % Math.max(1, players.length);
  const nextOpener = players[activeOpenerIdx] ?? players[0];

  const handleSelectOpener = (idx: number) => {
    store.setNextFrameOpener(idx);
  };

  const nextFrame = () => {
    // Ensure the designated opener is stored before newFrame runs
    store.setNextFrameOpener(activeOpenerIdx);
    store.newFrame();
  };

  const handleResume = () => {
    store.resumeFrame();
    if (onResume) onResume();
  };

  const endSession = () => {
    const archived = store.archiveAndReset();
    if (archived) onFinish(archived);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="glass-strong rounded-[24px] border border-border/80 shadow-2xl backdrop-blur-2xl p-4 sm:p-7 flex flex-col gap-5 select-none relative overflow-hidden"
    >
      {/* Subtle Ambient Radial Highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
      />

      {/* ─── 1. Header Zone ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30 text-primary shadow-xs">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
                Frame Concluded
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Frame {store.frames.length} Complete
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock size={12} className="text-primary" /> Frame: <strong className="text-foreground">{frameClock}</strong>
              </span>
              <span>·</span>
              <span>Session: <strong className="text-foreground">{sessionClock}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onResume && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResume}
              className="rounded-full text-xs font-mono gap-1.5 border-border/80 hover:border-primary/50"
              title="Resume unfinished frame if ended accidentally"
            >
              <RotateCcw size={12} />
              <span>Resume Frame</span>
            </Button>
          )}
          <Badge variant="gold" className="text-xs px-3 py-1 font-mono font-bold">
            {store.frames.length} Frame{store.frames.length > 1 ? "s" : ""} Played
          </Badge>
        </div>
      </div>

      {/* ─── 2. Frame Winner Spotlight Hero Podium ─────────────────────────── */}
      {frameWinner ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-[20px] border border-gold/40 bg-gradient-to-r from-gold/15 via-gold/5 to-transparent p-4 sm:p-4.5 shadow-md flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <AvatarBubble avatar={frameWinner.avatar} size={36} />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-black shadow-xs">
                <Trophy size={10} className="fill-black" />
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gold">
                  Frame Winner
                </span>
                <Award size={12} className="text-gold" />
              </div>
              <span className="truncate text-base sm:text-lg font-black text-foreground leading-tight">
                {frameWinner.nickname}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-2 shrink-0 text-right">
            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block">
                Frame Pts
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-gold leading-tight">
                {frame.scores[frameWinner.id] ?? 0}
              </span>
            </div>
            {(frame.money?.[frameWinner.id] ?? 0) !== 0 && (
              <div className="pl-2 border-l border-gold/30">
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block">
                  Net Frame
                </span>
                <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-primary leading-tight">
                  +฿{frame.money?.[frameWinner.id]}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      ) : isTie ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-[20px] border border-violation/40 bg-gradient-to-r from-violation/15 via-violation/5 to-transparent p-4 sm:p-4.5 shadow-md flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex -space-x-2 shrink-0">
              {tiedWinners.map((p) => (
                <AvatarBubble key={p.id} avatar={p.avatar} size={34} />
              ))}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violation">
                  Drawn Frame · Tied Scores
                </span>
                <Award size={12} className="text-violation" />
              </div>
              <span className="truncate text-base sm:text-lg font-black text-foreground leading-tight">
                {tiedWinners.map((p) => p.nickname).join(" & ")}
              </span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block">
              Tied At
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-violation leading-tight">
              {maxScore} pts
            </span>
          </div>
        </motion.div>
      ) : null}

      {/* ─── 3. Next Frame Opener Radar Capsule & Selector ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-[20px] border border-primary/30 bg-surface/90 p-3.5 sm:p-4 shadow-sm flex flex-col gap-2.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/20 text-primary shrink-0 border border-primary/35">
              <Target size={14} />
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Next Frame Break Off
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            Tap a player to switch opener
          </span>
        </div>

        {/* Interactive Opener Selector Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {players.map((p, idx) => {
            const isSelected = idx === activeOpenerIdx;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectOpener(idx)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-xs",
                  isSelected
                    ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/25 ring-2 ring-primary/40 scale-102"
                    : "bg-card/80 border border-border text-foreground/80 hover:bg-card hover:border-primary/40"
                )}
              >
                <AvatarBubble avatar={p.avatar} size={20} />
                <span className="truncate max-w-[100px]">{p.nickname}</span>
                {isSelected && (
                  <span className="rounded-full bg-white/25 px-1.5 py-0.2 text-[9px] font-mono font-black uppercase">
                    Breaks
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ─── 4. Per-Frame Standing Scoreboard Table ─────────────────────────── */}
      <div className="rounded-[20px] border border-border/80 bg-surface/90 overflow-hidden shadow-md">
        <div className="px-4 py-2.5 bg-card/60 border-b border-border/70 flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Trophy size={13} className="text-primary" /> Frame Standings
          </span>
          <span className="text-[11px] text-foreground/80">{frameTotal} Total Pts</span>
        </div>
        <div className="flex flex-col divide-y divide-border/60">
          {sorted.map((p, i) => {
            const score = frame.scores[p.id] ?? 0;
            const money = frame.money?.[p.id] ?? 0;
            const isWinner = winnerIds.includes(p.id);
            return (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-2.5 sm:gap-3 px-4 py-3 transition-colors",
                  isWinner && !isTie ? "bg-primary/5" : isWinner && isTie ? "bg-violation/5" : "hover:bg-white/[0.02]"
                )}
              >
                {/* Rank Badge */}
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-black",
                    i === 0 && score > 0
                      ? isTie
                        ? "bg-violation text-black shadow-xs ring-1 ring-violation/40"
                        : "bg-gold text-black shadow-xs ring-1 ring-gold/40"
                      : "bg-card border border-border text-muted-foreground"
                  )}
                >
                  #{i + 1}
                </span>

                <AvatarBubble avatar={p.avatar} size={28} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-bold text-sm text-foreground">
                      {p.nickname}
                    </span>
                    {isWinner && !isTie && (
                      <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.2 bg-gold/15 border border-gold/30 text-[9px] font-mono font-bold text-gold uppercase tracking-wider">
                        <Trophy size={9} /> Won
                      </span>
                    )}
                    {isWinner && isTie && (
                      <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.2 bg-violation/15 border border-violation/30 text-[9px] font-mono font-bold text-violation uppercase tracking-wider">
                        <Award size={9} /> Tied
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm sm:text-base font-black font-mono tabular-nums text-foreground block leading-tight">
                    {score} <span className="text-xs font-normal text-muted-foreground">pts</span>
                  </span>
                </div>

                <div className="w-20 sm:w-24 text-right shrink-0">
                  <span
                    className={cn(
                      "text-xs sm:text-sm font-black font-mono tabular-nums px-2 py-0.5 rounded-lg inline-block",
                      money > 0
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : money < 0
                          ? "bg-destructive/15 text-destructive border border-destructive/30"
                          : "text-muted-foreground"
                    )}
                  >
                    {money > 0 ? "+" : ""}
                    {formatMoney(money)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 5. Running Session Ledger ──────────────────────────────────────── */}
      <div className="rounded-[20px] border border-border/80 bg-surface/90 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Coins size={14} className="text-gold" /> Session Net Balance
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            {store.mode === "points" ? "Rate: Per Point" : "Rate: Per Ball"}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {players.map((p) => {
            const net = running[p.id] ?? 0;
            return (
              <div
                key={p.id}
                className="rounded-[16px] border border-border/70 bg-card/80 p-3 flex flex-col justify-between shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AvatarBubble avatar={p.avatar} size={18} />
                  <span className="truncate text-xs font-semibold text-foreground/90">
                    {p.nickname}
                  </span>
                </div>
                <div
                  className={cn(
                    "mt-2 text-base sm:text-lg font-black font-mono tabular-nums leading-none",
                    net > 0
                      ? "text-primary"
                      : net < 0
                        ? "text-destructive"
                        : "text-muted-foreground"
                  )}
                >
                  {net > 0 ? "+" : ""}
                  {formatMoney(net)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 6. Action Deck Buttons ────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5 sm:flex-row pt-1">
        <Button
          size="lg"
          className="flex-1 gap-2.5 h-12 text-sm font-bold shadow-lg shadow-primary/20 rounded-full"
          onClick={nextFrame}
        >
          <Play size={16} fill="currentColor" />
          <span>Next Frame</span>
          <span className="text-xs font-normal opacity-85 truncate">
            · {nextOpener.nickname} opens
          </span>
        </Button>
        <Button
          variant="danger"
          size="lg"
          className="sm:w-48 h-12 text-sm font-bold gap-2 rounded-full border border-destructive/40"
          onClick={endSession}
        >
          <Flag size={16} />
          <span>End Session & Settle</span>
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground text-center font-mono">
        Next frame starts a fresh frame with {nextOpener.nickname} breaking off. End session archives game and displays settlement matrix.
      </p>
    </motion.div>
  );
}