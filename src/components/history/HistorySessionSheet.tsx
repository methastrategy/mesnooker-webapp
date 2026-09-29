"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Clock3,
  Flag,
  Crosshair,
  TimerReset,
  Users,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { Sheet, Badge, BallDot } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { formatMoney, formatDateTime, formatTime } from "@/lib/utils";
import { optimizeTransfers } from "@/lib/money";
import { BALL_ORDER, BALL_NAME } from "@/lib/rules";
import { cn } from "@/lib/utils";
import type { ArchivedFrame, ArchivedGame } from "@/types";

/** Session drill-down: tap a finished game in History to open this and read
 *  each frame separately (scores, money, potted rack, penalties, winner).
 *  Bottom sheet on mobile, right rail on desktop. */
export function HistorySessionSheet({
  game,
  onClose,
}: {
  game: ArchivedGame | null;
  onClose: () => void;
}) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [expanded, setExpanded] = useState<number | "all">("all");

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    // fresh open → every frame visible (the user asked for per-frame detail)
    setExpanded("all");
  }, [game?.id]);

  if (!game) return null;

  const details = game.frameDetails;
  const hasDetails = Array.isArray(details) && details.length > 0;
  const rateLabel =
    game.moneyPer === "ball"
      ? `${formatMoney(game.moneyRate)}/ball`
      : `${formatMoney(game.moneyRate)}/pt`;

  return (
    <Sheet open={!!game} onClose={onClose} title="Session details" side={isDesktop ? "right" : "bottom"}>
      {/* ── Session header ─────────────────────────────── */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant={game.mode === "points" ? "default" : "gold"}>
          {game.mode === "points" ? "Points" : "Balls"}
        </Badge>
        <Badge variant="neutral">{rateLabel}</Badge>
        <Badge variant="info">
          <Users size={11} /> {game.players.length}
        </Badge>
        <Badge variant="info">
          <Flag size={11} /> {game.frames} frame{game.frames === 1 ? "" : "s"}
        </Badge>
        <span className="text-[11px] text-muted-foreground">{formatDateTime(game.endedAt)}</span>
      </div>

      {/* who owed whom, settled from the session total */}
      <div className="mb-3 rounded-2xl border border-border/80 bg-surface/85 backdrop-blur-md px-3.5 py-3 shadow-sm">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Settlement</div>
        {optimizeTransfers(game.balances, game.players).slice(0, 4).map((t, i) => (
          <span key={i} className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate font-semibold text-foreground/90">{t.fromName}</span>
            <ArrowRight size={11} className="text-gold shrink-0" />
            <span className="truncate font-semibold text-foreground/90">{t.toName}</span>
            <span className="font-mono font-bold text-gold shrink-0">{formatMoney(t.amount)}</span>
          </span>
        ))}
      </div>

      {hasDetails ? (
        <div className="flex flex-col gap-2.5">
          {details.map((fr) => (
            <FrameDetailCard
              key={fr.index}
              frame={fr}
              game={game}
              open={expanded === "all" || expanded === fr.index}
              onToggle={() => setExpanded(expanded === fr.index ? "all" : fr.index)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-surface/70 p-6 text-center text-muted-foreground backdrop-blur-md">
          <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground">
            <Clock3 size={20} />
          </span>
          <p className="text-sm font-semibold text-foreground/80">Per-frame details unavailable</p>
          <p className="mt-1 text-xs">
            This game was finished before frame-level details were recorded.
            Newer sessions store every frame separately.
          </p>
        </div>
      )}

      {/* per-player session total recap */}
      <div className="mt-5 border-t border-border/80 px-1 pt-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Session results</div>
        {game.players.map((p) => {
          const net = game.balances[p.id] ?? 0;
          return (
            <div key={p.id} className="mt-1.5 flex items-center gap-2 rounded-full border border-border/80 bg-surface/85 px-3.5 py-2 shadow-xs">
              {p.avatar ? <AvatarBubble avatar={p.avatar} size={24} /> : <BallDot color={p.color} size={10} />}
              <span className="flex-1 min-w-0 truncate text-xs sm:text-sm font-semibold">{p.nickname}</span>
              <span className={cn("text-xs sm:text-sm font-mono font-bold tabular-nums shrink-0", net > 0 ? "text-primary" : net < 0 ? "text-destructive" : "text-muted-foreground")}>
                {net > 0 ? "+" : ""}
                {formatMoney(net)}
              </span>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

/** One frame — header (winner, duration, break) + per-player rows + potted rack */
function FrameDetailCard({
  frame,
  game,
  open,
  onToggle,
}: {
  frame: ArchivedFrame;
  game: ArchivedGame;
  open: boolean;
  onToggle: () => void;
}) {
  const winner = game.players.find((p) => p.id === frame.winnerId);
  const duration = frame.endedAt
    ? Math.max(0, Math.round((frame.endedAt - frame.startedAt) / 1000))
    : 0;
  const durLabel = duration >= 60 ? `${Math.floor(duration / 60)}m ${duration % 60}s` : `${duration}s`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay: Math.min(frame.index * 0.06, 0.3) }}
      className="glass relative overflow-hidden rounded-[10px]"
    >
      {/* frame header — tap to collapse/expand */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-left cursor-pointer"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Badge variant="default">Frame {frame.index + 1}</Badge>
          {winner && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold truncate">
              <Trophy size={12} className="shrink-0" /> {winner.nickname}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground ml-auto">
          <span className="hidden min-[360px]:inline-flex items-center gap-1">
            <Clock3 size={11} /> {formatTime(frame.startedAt)}
          </span>
          {frame.endedAt && (
            <span className="inline-flex items-center gap-1">
              <TimerReset size={11} /> {durLabel}
            </span>
          )}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} />
          </motion.span>
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-1.5 px-3 pt-1 pb-3 border-t border-border">
          {/* per-player scoreboard */}
          {game.players.map((p) => {
            const pts = frame.scores[p.id] ?? 0;
            const money = frame.money[p.id] ?? 0;
            const brk = frame.breaks[p.id] ?? 0;
            const fouls = frame.fouls[p.id] ?? 0;
            const misses = frame.snookerMisses[p.id] ?? 0;
            const hits = frame.snookerHits[p.id] ?? 0;
            return (
              <div key={p.id} className="flex items-center gap-1.5 sm:gap-2 rounded-[8px] border border-border bg-surface px-2.5 py-2">
                {p.avatar ? <AvatarBubble avatar={p.avatar} size={22} /> : <BallDot color={p.color} size={10} />}
                <span className={cn("min-w-0 flex-1 truncate text-xs sm:text-sm font-medium", frame.winnerId === p.id ? "text-gold" : "text-foreground")}>
                  {p.nickname}
                  {frame.winnerId === p.id && <Trophy size={11} className="ml-1 inline text-gold" />}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">♥{brk}</span>
                {(fouls > 0 || misses > 0 || hits > 0) && (
                  <span className="hidden min-[360px]:inline text-[10px] font-mono text-muted-foreground shrink-0">
                    F{fouls}·M{misses}·S{hits}
                  </span>
                )}
                <span className="text-right text-xs sm:text-sm font-mono font-semibold tabular-nums shrink-0">{pts} pts</span>
                <span className={cn("min-w-[54px] sm:min-w-[64px] text-right text-xs sm:text-sm font-mono font-bold tabular-nums shrink-0", money > 0 ? "text-primary" : money < 0 ? "text-destructive" : "text-muted-foreground")}>
                  {money > 0 ? "+" : ""}
                  {formatMoney(money)}
                </span>
              </div>
            );
          })}

          {/* potted rack — balls actually removed from the table this frame */}
          <div className="flex flex-wrap items-center gap-1.5 px-1 pt-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Potted</span>
            {BALL_ORDER.map((c) => {
              const n = frame.totalPotted[c] ?? 0;
              if (n <= 0) return null;
              return (
                <span key={c} title={`${BALL_NAME[c]} ×${n}`} className="flex items-center gap-0.5 rounded-[5px] border border-border bg-surface px-1.5 py-0.5">
                  <BallDot color={c} size={11} />
                  <span className="text-[10px] font-mono font-semibold tabular-nums text-muted-foreground">×{n}</span>
                </span>
              );
            })}
            {frame.highestBreak > 0 && (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-mono text-gold">
                <Crosshair size={11} /> best break {frame.highestBreak}
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}