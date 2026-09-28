"use client";

import { motion } from "framer-motion";
import { Play, Flag, Trophy, Target, Coins, CheckCircle2 } from "lucide-react";
import { useGameStore, useRunningBalance } from "@/store/gameStore";
import { Button, Badge, Stat } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { formatMoney } from "@/lib/utils";
import { useElapsedSum } from "@/hooks/useElapsed";
import type { ArchivedGame } from "@/types";

/**
 * Shown right after a frame is ended (via "End frame" or auto-end on black).
 * Supabase Dark Matrix Style — graphite panels with electric emerald CTA.
 */
export function FramePauseSummary({
  onFinish,
}: {
  onFinish: (a: ArchivedGame) => void;
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

  // nextFrameFirstShooter: who opens the next frame (set by auto-end on black)
  const nextOpenerIdx = store.session.nextFrameFirstShooter;
  const nextOpener =
    nextOpenerIdx !== undefined ? players[nextOpenerIdx] : undefined;

  const nextFrame = () => {
    store.newFrame();
  };

  const endSession = () => {
    const archived = store.archiveAndReset();
    if (archived) onFinish(archived);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 24 }}
      className="rounded-[10px] border border-border bg-card p-4 sm:p-6 flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-foreground">
            <CheckCircle2 size={20} className="text-primary" /> Frame {store.frames.length} complete
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Frame {frameClock} · Session {sessionClock}
          </p>
        </div>
        <Badge variant="gold">
          {store.frames.length} frame{store.frames.length > 1 ? "s" : ""} played
        </Badge>
      </div>

      {/* "Who breaks next" callout — shown when auto-end on black */}
      {nextOpener && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-3 rounded-[8px] bg-primary/10 border border-primary/30 px-3.5 py-3"
        >
          <Target size={20} className="text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Breaks next frame
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <AvatarBubble avatar={nextOpener.avatar} size={24} />
              <span className="font-bold text-primary text-sm truncate">
                {nextOpener.nickname}
              </span>
            </div>
          </div>
          <span className="rounded-[6px] bg-primary/20 border border-primary/40 px-2 py-0.5 text-[10px] font-mono text-primary uppercase font-bold shrink-0">
            Opener
          </span>
        </motion.div>
      )}

      {/* Per-frame result */}
      <div className="rounded-[8px] border border-border bg-surface overflow-hidden">
        <div className="px-3 pt-3 pb-2 text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>This frame result</span>
          <span>{frameTotal} pts</span>
        </div>
        <div className="flex flex-col">
          {sorted.map((p, i) => {
            const score = frame.scores[p.id] ?? 0;
            const money = frame.money?.[p.id] ?? 0;
            const isWinner = winnerIds.includes(p.id);
            return (
              <div
                key={p.id}
                className="flex items-center gap-2.5 sm:gap-3 border-b border-border last:border-0 px-3 py-2.5"
              >
                {/* rank */}
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] font-mono text-[11px] font-bold ${
                    i === 0 && score > 0
                      ? "bg-gold text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground"
                  }`}
                >
                  #{i + 1}
                </span>
                <AvatarBubble avatar={p.avatar} size={26} />
                <span className="flex-1 min-w-0 truncate font-medium text-sm text-foreground">
                  {p.nickname}{" "}
                  {isWinner ? (
                    <Trophy size={13} className="inline text-gold ml-1" />
                  ) : null}
                </span>
                <span className="text-xs sm:text-sm font-semibold font-mono tabular-nums text-foreground/85 shrink-0">
                  {score} pts
                </span>
                <span
                  className={`w-16 sm:w-20 text-right text-xs sm:text-sm font-bold font-mono tabular-nums shrink-0 ${
                    money > 0
                      ? "text-primary"
                      : money < 0
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }`}
                >
                  {money > 0 ? "+" : ""}
                  {formatMoney(money)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Running session total */}
      <div className="rounded-[8px] border border-border bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Coins size={13} className="text-gold" /> Session Net Balance
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">
            {store.mode === "points" ? "per point" : "per ball"}
          </span>
        </div>
        <div className="flex flex-wrap gap-4 pt-1">
          {players.map((p) => (
            <Stat key={p.id} label={p.nickname} value={running[p.id] ?? 0} variant="money" />
          ))}
        </div>
      </div>

      {/* Next frame or end the session */}
      <div className="flex flex-col gap-2 sm:flex-row pt-1">
        <Button size="lg" className="flex-1 gap-2" onClick={nextFrame}>
          <Play size={16} fill="currentColor" />
          Next frame
          {nextOpener && (
            <span className="text-xs font-normal opacity-80 truncate">
              · {nextOpener.nickname} opens
            </span>
          )}
        </Button>
        <Button variant="danger" size="lg" className="flex-1" onClick={endSession}>
          <Flag size={16} /> End session
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground text-center font-mono">
        Next frame starts a fresh frame. End session archives and displays settlement matrix.
      </p>
    </motion.div>
  );
}