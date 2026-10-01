"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, ArrowRight, Copy, Check, Sparkles, Award } from "lucide-react";
import type { ArchivedGame } from "@/types";
import { optimizeTransfers } from "@/lib/money";
import { Button, Badge } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { useGameStore } from "@/store/gameStore";
import { formatMoney, formatDateTime, cn } from "@/lib/utils";

/**
 * Final settlement summary shown after a game ends (End Session).
 * Raycast Precision + Luxury Sports standard with concentric squircle geometry,
 * Champion spotlight (supporting single or joint champions), rich transfer avatars,
 * and 1-tap clipboard report export.
 */
export function FrameCompleteSummary({
  game,
  onNewGame,
}: {
  game: ArchivedGame;
  onNewGame: () => void;
  onViewHistory?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  // Read the live copy from history so edits re-render here.
  const live = useGameStore((s) => s.history.find((g) => g.id === game.id)) ?? game;

  const playerMap = useMemo(() => new Map(live.players.map((p) => [p.id, p])), [live.players]);

  // Settlement uses raw winnings (no table-fee split on the Match page).
  const rawTotal = live.players.reduce((s, p) => s + Math.max(0, live.rawBalances?.[p.id] ?? 0), 0);
  const sorted = [...live.players].sort(
    (a, b) =>
      (live.rawBalances?.[b.id] ?? live.balances[b.id] ?? 0) -
      (live.rawBalances?.[a.id] ?? live.balances[a.id] ?? 0)
  );
  const transfers = optimizeTransfers(live.rawBalances, live.players);
  const win = (live.mode === "points" ? "point" : "ball") as "point" | "ball";

  // Champion detection supporting single or tied co-champions
  const maxBal = Math.max(0, ...sorted.map((p) => live.rawBalances?.[p.id] ?? live.balances[p.id] ?? 0));
  const champions = maxBal > 0
    ? sorted.filter((p) => (live.rawBalances?.[p.id] ?? live.balances[p.id] ?? 0) === maxBal)
    : [];
  const isJoint = champions.length > 1;
  const hasChampion = champions.length > 0;
  const champion = champions[0];

  const copySettlementReport = async () => {
    const lines: string[] = [
      `🎱 MESNOOKER MATCH SETTLEMENT`,
      `Frames: ${live.frames} · Rate: ฿${live.moneyRate}/${win}`,
      `Date: ${formatDateTime(live.endedAt)}`,
      `--------------------------------`,
      `🏆 Final Standings:`,
      ...sorted.map((p, i) => {
        const bal = live.rawBalances?.[p.id] ?? live.balances[p.id] ?? 0;
        return `${i + 1}. ${p.nickname}: ${bal > 0 ? "+" : ""}${formatMoney(bal)}`;
      }),
      `--------------------------------`,
      `💸 Who Pays Whom:`,
      ...(transfers.length > 0
        ? transfers.map((t) => `• ${t.fromName} pays ${t.toName} ${formatMoney(t.amount)}`)
        : [`• Table settled evenly — nobody owes.`]),
    ];

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 24 }}
      className="glass-strong rounded-[24px] border border-primary/30 shadow-2xl flex flex-col gap-5 p-4 sm:p-7 relative overflow-hidden select-none"
    >
      {/* Ambient Champion Spotlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/15 blur-3xl"
      />

      {/* ─── 1. Header Zone ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/15 border border-gold/40 text-gold shadow-xs">
            <Trophy size={24} className="fill-gold/30" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gold">
                Session Complete
              </span>
              <Sparkles size={11} className="text-gold" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Match Concluded & Settled
            </h2>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              {live.frames} frame{live.frames > 1 ? "s" : ""} · ฿{live.moneyRate}/{win} · {formatDateTime(live.endedAt)}
            </p>
          </div>
        </div>

        <div>
          {rawTotal > 0 ? (
            <Badge variant="gold" className="text-xs px-3 py-1 font-mono font-bold">
              Net Pool +{formatMoney(rawTotal)}
            </Badge>
          ) : (
            <Badge className="text-xs px-3 py-1 font-mono font-bold">Settled</Badge>
          )}
        </div>
      </div>

      {/* ─── 2. Champion Spotlight Podium ─────────────────────────────────── */}
      {hasChampion && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-[20px] border border-gold/40 bg-gradient-to-r from-gold/20 via-gold/10 to-transparent p-4 sm:p-5 shadow-lg flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {isJoint ? (
              <div className="flex -space-x-2 shrink-0">
                {champions.map((c) => (
                  <AvatarBubble key={c.id} avatar={c.avatar} size={38} />
                ))}
              </div>
            ) : (
              <div className="relative shrink-0">
                <AvatarBubble avatar={champion.avatar} size={42} />
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-black shadow-md ring-2 ring-card">
                  <Trophy size={11} className="fill-black" />
                </span>
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gold">
                  {isJoint ? "Joint Session Champions" : "Session Champion"}
                </span>
                <Award size={12} className="text-gold" />
              </div>
              <span className="truncate text-lg sm:text-xl font-black text-foreground leading-tight">
                {isJoint ? champions.map((c) => c.nickname).join(" & ") : champion.nickname}
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block leading-tight">
              {isJoint ? "Each Winnings" : "Total Winnings"}
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-gold leading-tight">
              +{formatMoney(maxBal)}
            </span>
          </div>
        </motion.div>
      )}

      {/* ─── 3. Final Standings Ledger ────────────────────────────────────── */}
      <div className="rounded-[20px] border border-border/80 bg-surface/90 p-4 shadow-sm">
        <h3 className="mb-2.5 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>Final Standings</span>
          <span className="text-[11px] font-mono text-muted-foreground">{sorted.length} players</span>
        </h3>
        <div className="flex flex-col gap-2">
          {sorted.map((p, i) => {
            const bal = live.rawBalances?.[p.id] ?? live.balances[p.id] ?? 0;
            const isWinner = champions.some((c) => c.id === p.id);
            return (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-3 rounded-[16px] px-3.5 py-2.5 transition-all border",
                  isWinner
                    ? "bg-gold/10 border-gold/40 shadow-xs"
                    : "bg-card/80 border-border/70"
                )}
              >
                {/* Rank Badge */}
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-black",
                    isWinner
                      ? "bg-gold text-black shadow-xs ring-1 ring-gold/40"
                      : "bg-surface border border-border text-muted-foreground"
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
                    {isWinner && (
                      <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.2 bg-gold/20 border border-gold/35 text-[9px] font-mono font-bold text-gold uppercase tracking-wider">
                        <Trophy size={9} /> {isJoint ? "Joint Champion" : "Champion"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={cn(
                      "text-base sm:text-lg font-black font-mono tabular-nums leading-none",
                      bal > 0
                        ? "text-primary"
                        : bal < 0
                          ? "text-destructive"
                          : "text-muted-foreground"
                    )}
                  >
                    {bal > 0 ? "+" : ""}
                    {formatMoney(bal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 4. Settlement Matrix ("Who Pays Whom") ───────────────────────── */}
      <div className="rounded-[20px] border border-border/80 bg-surface/90 p-4 shadow-sm">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
            Settlement Matrix · Who Pays Whom
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">
            ≤ {live.players.length - 1} transfers
          </span>
        </div>

        {transfers.length === 0 ? (
          <div className="rounded-[16px] border border-border/70 bg-card/60 p-5 text-center text-xs font-mono text-muted-foreground">
            Everyone settled evenly — nothing to pay.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {transfers.map((t, i) => {
              const fromP = playerMap.get(t.fromPlayerId);
              const toP = playerMap.get(t.toPlayerId);

              return (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-[16px] bg-card/90 border border-border/80 px-3.5 py-3 text-sm shadow-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {fromP && <AvatarBubble avatar={fromP.avatar} size={22} />}
                      <span className="font-bold text-foreground truncate">{t.fromName}</span>
                    </div>

                    <ArrowRight size={13} className="text-gold shrink-0" />

                    <div className="flex items-center gap-1.5 min-w-0">
                      {toP && <AvatarBubble avatar={toP.avatar} size={22} />}
                      <span className="font-bold text-foreground truncate">{t.toName}</span>
                    </div>
                  </div>
                  <div className="rounded-full bg-gold/15 border border-gold/35 px-3 py-1 shrink-0 font-mono font-black tabular-nums text-gold text-sm sm:text-base">
                    {formatMoney(t.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 1-Tap Group Report Share Button */}
        <div className="mt-3 pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-[11px] font-mono text-muted-foreground">
            Optimal path settled from net balances.
          </p>
          <button
            type="button"
            onClick={copySettlementReport}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border/80 bg-card px-3.5 py-1.5 text-xs font-mono font-semibold text-foreground hover:bg-surface hover:border-primary/50 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
          >
            {copied ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
            <span>{copied ? "Report Copied!" : "Copy Report"}</span>
          </button>
        </div>
      </div>

      {/* ─── 5. Navigation & Next Steps ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
        <Button
          size="lg"
          className="flex-1 gap-2 h-12 text-sm font-bold shadow-lg shadow-primary/20 rounded-full"
          onClick={onNewGame}
        >
          <Trophy size={16} />
          <span>Start New Game</span>
        </Button>
        <Link
          href="/match?tab=history"
          className="inline-flex items-center justify-center h-12 px-6 rounded-full border border-border/80 bg-card hover:bg-surface text-sm font-semibold transition-all text-center"
        >
          View Full Ledger & History
        </Link>
      </div>
    </motion.div>
  );
}