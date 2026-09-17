"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PartyPopper, Trophy, ArrowDown } from "lucide-react";
import type { ArchivedGame } from "@/types";
import { optimizeTransfers } from "@/lib/money";
import { Button, Badge } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { useGameStore } from "@/store/gameStore";
import { formatMoney, formatDateTime } from "@/lib/utils";

/**
 * Final settlement summary shown after a game ends.
 *
 * Clean summary of who won and who pays whom. The table-fee stepper was removed
 * from the Match page per the user's choice (a live score screen shouldn't
 * surface table-split UI); settlement computes directly from raw balances.
 */
export function FrameCompleteSummary({
  game,
  onNewGame,
}: {
  game: ArchivedGame;
  onNewGame: () => void;
}) {
  // Read the live copy from history so edits re-render here.
  const live = useGameStore((s) => s.history.find((g) => g.id === game.id)) ?? game;

  // Settlement uses raw winnings (no table-fee split on the Match page).
  const rawTotal = live.players.reduce((s, p) => s + Math.max(0, live.rawBalances?.[p.id] ?? 0), 0);
  const sorted = [...live.players].sort((a, b) => (live.rawBalances?.[b.id] ?? live.balances[b.id] ?? 0) - (live.rawBalances?.[a.id] ?? live.balances[a.id] ?? 0));
  const transfers = optimizeTransfers(live.rawBalances, live.players);
  const win = (live.mode === "points" ? "point" : "ball") as "point" | "ball";

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
            {live.frames} frame{live.frames > 1 ? "s" : ""} · ฿{live.moneyRate}/{win} · {formatDateTime(live.endedAt)}
          </p>
        </div>
        {rawTotal > 0 ? <Badge variant="gold">net +{formatMoney(rawTotal)}</Badge> : <Badge>settled</Badge>}
      </div>

      {/* Who + / − */}
      <div className="glass">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tonight’s result</h3>
        <div className="flex flex-col">
          {sorted.map((p, i) => {
            const bal = live.rawBalances?.[p.id] ?? live.balances[p.id] ?? 0;
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
          <p className="py-4 text-center text-sm text-muted-foreground">
            Everyone settled — nothing to pay. 🎉
          </p>
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
          ≤ {live.players.length - 1} transfers — the simplest way to settle everyone.
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