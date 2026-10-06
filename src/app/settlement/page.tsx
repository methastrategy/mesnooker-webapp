"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, PartyPopper } from "lucide-react";
import { useGameStore, useRunningBalance } from "@/store/gameStore";
import { SettlementPanel, type PaymentRecord } from "@/components/settlement/SettlementPanel";
import { GlassCard, Button, Badge } from "@/components/ui";
import { optimizeTransfers } from "@/lib/money";
import { formatMoney, cn } from "@/lib/utils";

export default function SettlementPage() {
  const session = useGameStore((s) => s.session);
  const players = useGameStore((s) => s.players);
  const history = useGameStore((s) => s.history);
  const sessionRunning = useRunningBalance();
  const paidTransfers = useGameStore((s) => s.paidTransfers ?? []);
  const markTransferPaid = useGameStore((s) => s.markTransferPaid);
  const undoTransferPayment = useGameStore((s) => s.undoTransferPayment);
  const [copied, setCopied] = useState(false);

  const isHistoryFallback = !session && history.length > 0;
  const targetMatch = session ?? (isHistoryFallback ? history[0] : null);
  const targetPlayers = session ? players : (history[0]?.players ?? []);
  const targetRunning = session ? sessionRunning : (history[0]?.balances ?? history[0]?.rawBalances ?? {});

  const paidSet = new Set(paidTransfers);
  const transfers = optimizeTransfers(targetRunning, targetPlayers);
  // Derive the panel's payment records from the actual persisted paid set.
  const payments: PaymentRecord[] = transfers.map((t) => ({
    id: `${t.fromPlayerId}->${t.toPlayerId}`,
    fromPlayerId: t.fromPlayerId,
    toPlayerId: t.toPlayerId,
    amount: t.amount,
    status: paidSet.has(`${t.fromPlayerId}->${t.toPlayerId}`) ? "paid" : "pending",
  }));
  const outstanding = transfers.filter((t) => !paidSet.has(`${t.fromPlayerId}->${t.toPlayerId}`));
  const allPaid = transfers.length === 0 || outstanding.length === 0;

  function markPaid(key: string) {
    markTransferPaid(key);
  }
  function undoPayment(key: string) {
    undoTransferPayment(key);
  }

  async function exportSummary() {
    const lines = transfers.map(
      (t) => `${t.fromName} pays ${t.toName} ${formatMoney(t.amount)}`
    );
    const text = lines.length
      ? lines.join("\n")
      : "Table settled — nobody owes.";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gold">
            Financial Settlement
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Table Settlement Matrix
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Who owes whom, and the mathematically minimal set of transfers to settle the entire table.
        </p>
      </motion.div>

      {!targetMatch ? (
        <GlassCard className="rounded-[22px] p-8 text-center text-muted-foreground font-mono text-sm">
          No active session or match history found. Start a match first from the Match board.
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-5">
          <GlassCard glow={allPaid ? "emerald" : "gold"} className="rounded-[24px] p-5 sm:p-7 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-border/70 pb-3">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span>{isHistoryFallback ? "Match Ledger & Transfers" : "Session Ledger & Transfers"}</span>
                  {isHistoryFallback && (
                    <Badge variant="neutral" className="text-[10px] py-0 px-1.5 font-normal">
                      Ended Match
                    </Badge>
                  )}
                </h3>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {targetPlayers.length} players involved
                </span>
              </div>
              {allPaid ? (
                <Badge variant="success" className="gap-1.5 px-3 py-1 font-mono font-bold text-xs">
                  <PartyPopper size={13} /> All Settled
                </Badge>
              ) : (
                <Badge variant="gold" className="px-3 py-1 font-mono font-bold text-xs">
                  Pending Transfers
                </Badge>
              )}
            </div>
            <SettlementPanel
              runningBalance={targetRunning}
              players={targetPlayers}
              payments={payments}
              onMarkPaid={(key) => markPaid(key)}
              onUndoPayment={(key) => undoPayment(key)}
            />
            {transfers.length > 0 && (
              <Button
                variant={allPaid ? "gold" : "default"}
                className={cn("mt-5 w-full h-12 rounded-full font-bold shadow-md", allPaid && "shadow-gold/20")}
                onClick={exportSummary}
              >
                <Download size={16} /> {copied ? "Copied summary to clipboard!" : allPaid ? "Export Settlement Summary (All Settled)" : "Copy Settlement Summary"}
              </Button>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}