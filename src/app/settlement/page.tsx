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
    <div className="flex flex-col gap-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Settlement</h1>
        <p className="text-sm text-muted-foreground">
          Who owes whom, and the minimal set of transfers to settle everyone.
        </p>
      </motion.div>

      {!session ? (
        <GlassCard className="p-8 text-center text-muted-foreground">
          No session yet. Start a match first.
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-5">
          <GlassCard glow={allPaid ? "emerald" : "gold"} className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Tonight's net
              </h3>
              {allPaid && (
                <Badge variant="success">
                  <PartyPopper size={12} /> All settled
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
              <Button variant="gold" className="mt-4 w-full" onClick={exportSummary}>
                <Download size={16} /> {copied ? "Copied to clipboard" : "Export summary"}
              </Button>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}