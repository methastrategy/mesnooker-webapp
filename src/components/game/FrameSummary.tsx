"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PartyPopper, Trophy, ArrowDown } from "lucide-react";
import type { ArchivedGame } from "@/types";
import { optimizeTransfers } from "@/lib/money";
import { Button, Badge } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { formatMoney, formatDateTime } from "@/lib/utils";

/** Final settlement summary shown after a game ends: who +/−, total, who pays whom. */
export function FrameCompleteSummary({
  game,
  onNewGame,
}: {
  game: ArchivedGame;
  onNewGame: () => void;
}) {
  const sorted = [...game.players].sort((a, b) => (game.balances[b.id] ?? 0) - (game.balances[a.id] ?? 0));
  const transfers = optimizeTransfers(game.balances, game.players);
  const totalWon = game.players.reduce((s, p) => s + Math.max(0, game.balances[p.id] ?? 0), 0);
  const win = (game.mode === "points" ? "point" : "ball") as "point" | "ball";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className="glass-strong glow-emerald flex flex-col gap-5 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">🎉 Game complete</h2>
          <p className="text-sm text-muted-foreground">
            {game.frames} frame{game.frames > 1 ? "s" : ""} · ฿{game.moneyRate}/{win} · {formatDateTime(game.endedAt)}
          </p>
        </div>
        {totalWon > 0 ? <Badge variant="gold">+{formatMoney(totalWon)}</Badge> : <Badge>settled</Badge>}
      </div>

      {/* Who + / − */}
      <div className="glass">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tonight’s result</h3>
        <div className="flex flex-col">
          {sorted.map((p, i) => {
            const bal = game.balances[p.id] ?? 0;
            const isWinner = i === 0 && bal > 0;
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
                <AvatarBubble avatar={p.avatar} size={34} />
                <span className="flex-1 truncate font-medium">
                  {p.nickname} {isWinner ? <Trophy size={13} className="inline text-gold" /> : null}
                </span>
                <span className={`text-lg font-bold tabular-nums ${bal > 0 ? "text-primary" : bal < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {bal > 0 ? "+" : ""}
                  {formatMoney(bal)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Who pays whom */}
      <div className="glass">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Who pays whom</h3>
        {transfers.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Everyone settled — nothing to pay. 🎉</p>
        ) : (
          <div className="flex flex-col">
            {transfers.map((t, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
                <span className="font-semibold">{t.fromName}</span>
                <ArrowDown size={14} className="text-gold" />
                <span className="font-semibold">{t.toName}</span>
                <span className="ml-auto font-bold tabular-nums text-gold">{formatMoney(t.amount)}</span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">
          ≤ {game.players.length - 1} transfers — the simplest way to settle everyone.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button size="lg" className="w-full" onClick={onNewGame}>
          <PartyPopper size={16} /> New game
        </Button>
        <Link href="/history" className="btn-mini mx-auto w-full">
          View history
        </Link>
      </div>
    </motion.div>
  );
}