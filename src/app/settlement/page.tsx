"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, PartyPopper } from "lucide-react";
import { useGameStore, useRunningBalance } from "@/store/gameStore";
import { SettlementPanel, type PaymentRecord } from "@/components/settlement/SettlementPanel";
import { GlassCard, Button, Badge } from "@/components/ui";
import { optimizeTransfers } from "@/lib/money";

export default function SettlementPage() {
  const session = useGameStore((s) => s.session);
  const players = useGameStore((s) => s.players);
  const running = useRunningBalance();
  const [payments] = useState<PaymentRecord[]>([]);
  const [paidSet, setPaidSet] = useState<Set<string>>(new Set());

  const transfers = optimizeTransfers(running, players);
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
              payments={payments.map((p) => ({
                ...p,
                status: paidSet.has(p.id) ? "paid" : "pending",
              }))}
              onMarkPaid={(key) => markPaid(key)}
              onUndoPayment={(key) => undoPayment(key)}
            />
            {allPaid && (
              <Button variant="gold" className="mt-4 w-full">
                <Download size={16} /> Export summary
              </Button>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}