"use client";

import { motion } from "framer-motion";
import { Play, Flag, Trophy } from "lucide-react";
import { useGameStore, useRunningBalance } from "@/store/gameStore";
import { Button, Badge, Stat } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { formatMoney } from "@/lib/utils";
import { useElapsedSum } from "@/hooks/useElapsed";
import type { ArchivedGame } from "@/types";

/**
 * Shown right after a frame is ended (via "End frame"). Summarises that single
 * frame + the running session total so far, then lets the player choose:
 *   - Next frame  -> continue the session with a fresh frame
 *   - End session -> finish the whole session and see the full summary
 * The session clock here is the SUM of all elapsed frame durations (it stops
 * counting while you sit on this screen between frames).
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
    (a, b) => (frame.scores[a.id] ?? 0) - (frame.scores[b.id] ?? 0)
  );
  const frameTotal = players.reduce((s, p) => s + (frame.scores[p.id] ?? 0), 0);
  const winnerIds = players
    .filter((p) => (frame.scores[p.id] ?? 0) === Math.max(0, ...players.map((x) => frame.scores[x.id] ?? 0)))
    .filter((p) => (frame.scores[p.id] ?? 0) > 0)
    .map((p) => p.id);

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
          <h2 className="text-xl font-bold">Frame {store.frames.length} finished</h2>
          <p className="text-sm text-muted-foreground">
            Frame {frameClock} · Session {sessionClock} (play time)
          </p>
        </div>
        <Badge variant="gold">frame {store.frames.length} / session</Badge>
      </div>

      {/* Per-frame result */}
      <div className="glass">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          This frame
        </h3>
        <div className="flex flex-col">
          {sorted.map((p) => {
            const score = frame.scores[p.id] ?? 0;
            const money = frame.money?.[p.id] ?? 0;
            const isWinner = winnerIds.includes(p.id);
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
                <AvatarBubble avatar={p.avatar} size={32} />
                <span className="flex-1 truncate font-medium">
                  {p.nickname} {isWinner ? <Trophy size={13} className="inline text-gold" /> : null}
                </span>
                <span className="text-sm font-semibold tabular-nums text-foreground/80">{score} pts</span>
                <span
                  className={`w-24 text-right text-sm font-semibold tabular-nums ${
                    money > 0 ? "text-primary" : money < 0 ? "text-destructive" : "text-muted-foreground"
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
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Session total so far
          </h3>
          <Badge variant="gold">{store.mode === "points" ? "per point" : "per ball"}</Badge>
        </div>
        <div className="flex flex-wrap gap-4">
          {players.map((p) => (
            <Stat key={p.id} label={p.nickname} value={running[p.id] ?? 0} variant="money" />
          ))}
        </div>
      </div>

      {/* Next frame or end the session */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button size="lg" className="flex-1" onClick={nextFrame}>
          <Play size={18} /> Next frame
        </Button>
        <Button variant="danger" size="lg" className="flex-1" onClick={endSession}>
          <Flag size={18} /> End session
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Next frame starts a fresh frame and keeps counting the session. End session closes the table
        and shows the full all-frame summary.
      </p>

      <div className="text-right">
        <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
          total {frameTotal} pts this frame
        </span>
      </div>
    </motion.div>
  );
}