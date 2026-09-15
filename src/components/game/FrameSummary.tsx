"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PartyPopper, Trophy, ArrowDown, Minus, Plus, Receipt } from "lucide-react";
import type { ArchivedGame } from "@/types";
import { optimizeTransfers } from "@/lib/money";
import { Button, Badge } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { useGameStore } from "@/store/gameStore";
import { formatMoney, formatDateTime } from "@/lib/utils";

/**
 * Final settlement summary shown after a game ends.
 *
 * The table fee is decided HERE (when you "close the table"), not at setup —
 * real snooker only tells you the fee at the end. Use the stepper to set it;
 * it splits evenly and recomputes who pays whom live, persisted to history.
 */
export function FrameCompleteSummary({
  game,
  onNewGame,
}: {
  game: ArchivedGame;
  onNewGame: () => void;
}) {
  const setArchivedTableFee = useGameStore((s) => s.setArchivedTableFee);
  // Read the live copy from history so fee edits re-render here.
  const live = useGameStore((s) => s.history.find((g) => g.id === game.id)) ?? game;

  const tableFee = live.tableFee;
  const tableShare = live.players.length > 0 ? tableFee / live.players.length : 0;
  const hasTable = tableFee > 0;

  // balances already reflect the fee (rawBalances - share). Total winnings shown
  // is the positive sum of rawBalances so it's stable regardless of the fee.
  const rawTotal = live.players.reduce((s, p) => s + Math.max(0, live.rawBalances?.[p.id] ?? 0), 0);
  const sorted = [...live.players].sort((a, b) => (live.balances[b.id] ?? 0) - (live.balances[a.id] ?? 0));
  const transfers = optimizeTransfers(live.balances, live.players);
  const win = (live.mode === "points" ? "point" : "ball") as "point" | "ball";

  const setFee = (v: number) => setArchivedTableFee(live.id, Math.max(0, v));

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
            {hasTable ? <span className="ml-1 text-gold">· table ฿{tableFee}</span> : null}
          </p>
        </div>
        {rawTotal > 0 ? <Badge variant="gold">net +{formatMoney(rawTotal)}</Badge> : <Badge>settled</Badge>}
      </div>

      {/* Who + / − */}
      <div className="glass">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tonight’s result</h3>
        <div className="flex flex-col">
          {sorted.map((p, i) => {
            const bal = live.balances[p.id] ?? 0;
            // raw winnings before table fee (for display when fee applies)
            const rawWin = live.rawBalances?.[p.id] ?? bal;
            const isWinner = i === 0 && bal > 0;
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
                <AvatarBubble avatar={p.avatar} size={34} />
                <span className="flex-1 truncate font-medium">
                  {p.nickname} {isWinner ? <Trophy size={13} className="inline text-gold" /> : null}
                </span>
                {hasTable ? (
                  <span className="text-right">
                    <span className={`block text-sm font-semibold tabular-nums ${
                      rawWin > 0 ? "text-primary" : rawWin < 0 ? "text-muted-foreground" : "text-muted-foreground"
                    }`}>
                      {rawWin > 0 ? "+" : ""}
                      {formatMoney(rawWin)}
                    </span>
                    <span className="block text-[11px] text-muted-foreground tabular-nums">
                      table −{formatMoney(tableShare)} ={" "}
                      <span className={bal > 0 ? "text-primary" : bal < 0 ? "text-destructive" : "text-muted-foreground"}>
                        {bal > 0 ? "+" : ""}
                        {formatMoney(bal)}
                      </span>
                    </span>
                  </span>
                ) : (
                  <span className={`text-lg font-bold tabular-nums ${bal > 0 ? "text-primary" : bal < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {bal > 0 ? "+" : ""}
                    {formatMoney(bal)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Table fee (decided now that the table is closed) */}
      <div className="glass">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Receipt size={14} className="mr-1 inline text-gold" /> Table fee
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">Close the table & split evenly among players:</span>
          <div className="flex items-center gap-2">
            <Button variant="glass" size="icon" onClick={() => setFee(tableFee - 10)} aria-label="Decrease table fee">
              <Minus size={18} />
            </Button>
            <div className="h-12 min-w-24 rounded-2xl border border-gold/40 bg-white/5 px-4 text-center text-xl font-bold text-gold tabular-nums">
              ฿{tableFee}
            </div>
            <Button variant="gold" size="icon" onClick={() => setFee(tableFee + 10)} aria-label="Increase table fee">
              <Plus size={18} />
            </Button>
          </div>
          {tableFee > 0 && live.players.length > 0 ? (
            <span className="text-[11px] text-muted-foreground">
              = ฿{Math.round(tableFee / live.players.length)} each
            </span>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => setFee(0)} disabled={!hasTable}>
            Clear
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          The fee is subtracted evenly from each player's winnings and updates who pays whom below.
        </p>
      </div>

      {/* Who pays whom */}
      <div className="glass">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Who pays whom</h3>
        {transfers.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {hasTable
              ? <>Each player pays <span className="font-semibold text-gold">฿{tableFee} total / {live.players.length} = {Math.round((tableFee / live.players.length) * 100) / 100}฿</span> table fee.</>
              : "Everyone settled — nothing to pay. 🎉"}
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