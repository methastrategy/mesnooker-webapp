"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, PartyPopper } from "lucide-react";
import { useGameStore, useRunningBalance } from "@/store/gameStore";
import { SettlementPanel, type PaymentRecord } from "@/components/settlement/SettlementPanel";
import { GlassCard, Button, Badge } from "@/components/ui";
import { optimizeTransfers } from "@/lib/money";
import { formatMoney } from "@/lib/utils";

export default function SettlementPage() {
  const session = useGameStore((s) => s.session);
  const players = useGameStore((s) => s.players);
  const running = useRunningBalance();
  const [paidSet, setPaidSet] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const transfers = optimizeTransfers(running, players);
  // Derive the panel's payment records from the actual paid set — previously
  // `payments` was an unused empty useState, so the panel's Pay→Undo toggle
  // and its "outstanding" badge could never update after tapping Pay.
  const payments: PaymentRecord[] = transfers.map((t) => ({
    id: `${t.fromPlayerId}->${t.toPlayerId}`,
    fromPlayerId: t.fromPlayerId,
    toPlayerId: t.toPlayerId,
    amount: t.amount,
    status: paidSet.has(`${t.fromPlayerId}->${t.toPlayerId}`) ? "paid" : "pending",
  }));
  const outstanding = transfers.filter((t) => !paidSet.has(`${t.fromPlayerId}->${t.toPlayerId}`));
  const allPaid = transfers.length > 0 && outstanding.length === 0;

  function markPaid(key: string) {
    setPaidSet((prev) => new Set(prev).add(key));
  }
  function undoPayment(key: string) {
    setPaidSet((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
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

      {!session ? (
        <GlassCard className="rounded-[22px] p-8 text-center text-muted-foreground font-mono text-sm">
          No active session found. Start a match first from the Match board.
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-5">
          <GlassCard glow={allPaid ? "emerald" : "gold"} className="rounded-[24px] p-5 sm:p-7 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-border/70 pb-3">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Session Ledger & Transfers
                </h3>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {players.length} players involved
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
              runningBalance={running}
              players={players}
              payments={payments}
              onMarkPaid={(key) => markPaid(key)}
              onUndoPayment={(key) => undoPayment(key)}
            />
            {allPaid && (
              <Button variant="gold" className="mt-5 w-full h-12 rounded-full font-bold shadow-md shadow-gold/20" onClick={exportSummary}>
                <Download size={16} /> {copied ? "Copied summary to clipboard!" : "Export Settlement Summary"}
              </Button>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}