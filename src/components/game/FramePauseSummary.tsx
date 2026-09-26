"use client";

import { motion } from "framer-motion";
import { Play, Flag, Trophy, ArrowRight } from "lucide-react";
import { useGameStore, useRunningBalance } from "@/store/gameStore";
import { Button, Badge, Stat } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { formatMoney } from "@/lib/utils";
import { useElapsedSum } from "@/hooks/useElapsed";
import type { ArchivedGame } from "@/types";

/**
 * Shown right after a frame is ended (via "End frame" or auto-end on black).
 * Summarises that single frame + the running session total so far, then lets
 * the player choose:
 *   - Next frame  → continue the session with a fresh frame
 *   - End session → finish the whole session and see the full summary
 * The session clock here is the SUM of all elapsed frame durations (it stops
 * counting while you sit on this screen between frames).
 *
 * NEW: Shows "who breaks next" (nextFrameFirstShooter) when auto-end on black.
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
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="glass-strong glow-emerald flex flex-col gap-5 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            🏁 Frame {store.frames.length} complete
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Frame {frameClock} · Session {sessionClock} (play time)
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
          className="flex items-center gap-3 rounded-2xl bg-primary/10 ring-1 ring-primary/30 px-4 py-3"
        >
          <span className="text-2xl">🎱</span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Breaks next frame
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <AvatarBubble avatar={nextOpener.avatar} size={28} />
              <span className="font-bold text-primary text-base">
                {nextOpener.nickname}
              </span>
            </div>
          </div>
          <Badge variant="default" className="shrink-0">opener</Badge>
        </motion.div>
      )}

      {/* Per-frame result */}
      <div className="glass">
        <h3 className="px-3 pt-3 pb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          This frame
        </h3>
        <div className="flex flex-col">
          {sorted.map((p, i) => {
            const score = frame.scores[p.id] ?? 0;
            const money = frame.money?.[p.id] ?? 0;
            const isWinner = winnerIds.includes(p.id);
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 border-b border-white/[0.04] last:border-0 px-3 py-2.5"
              >
                {/* rank */}
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    i === 0 && score > 0
                      ? "bg-gold text-black"
                      : "bg-white/10 text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <AvatarBubble avatar={p.avatar} size={32} />
                <span className="flex-1 truncate font-medium">
                  {p.nickname}{" "}
                  {isWinner ? (
                    <Trophy size={13} className="inline text-gold" />
                  ) : null}
                </span>
                <span className="text-sm font-semibold tabular-nums text-foreground/80">
                  {score} pts
                </span>
                <span
                  className={`w-20 text-right text-sm font-bold tabular-nums ${
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
      <div className="glass">
        <div className="mb-2 flex items-center justify-between px-3 pt-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Session total so far 💰
          </h3>
          <Badge variant="gold">
            {store.mode === "points" ? "per point" : "per ball"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-4 px-3 pb-3">
          {players.map((p) => (
            <Stat key={p.id} label={p.nickname} value={running[p.id] ?? 0} variant="money" />
          ))}
        </div>
      </div>

      {/* Next frame or end the session */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button size="lg" className="flex-1 gap-2" onClick={nextFrame}>
          <Play size={18} />
          Next frame
          {nextOpener && (
            <span className="text-sm opacity-70">
              · {nextOpener.nickname} opens
            </span>
          )}
        </Button>
        <Button variant="danger" size="lg" className="flex-1" onClick={endSession}>
          <Flag size={18} /> End session
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Next frame starts a fresh frame and keeps counting the session. End session closes
        the table and shows the full all-frame summary.
      </p>

      <div className="text-right">
        <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
          total {frameTotal} pts this frame
        </span>
      </div>
    </motion.div>
  );
}