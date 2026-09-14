"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, CreditCard, Copy } from "lucide-react";
import type { Player } from "@/types";
import { optimizeTransfers, type SettlementInstruction } from "@/lib/money";
import { Badge, Button } from "@/components/ui";
import { BallDot } from "@/components/ui/snooker-ball";
import { formatMoney, formatNumber } from "@/lib/utils";

export interface PaymentRecord {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
  status: "paid" | "pending";
}

/** Settlement panel: who pays whom (minimal transfers), mark paid, running balance */
export function SettlementPanel({
  runningBalance,
  players,
  payments,
  onMarkPaid,
  onUndoPayment,
}: {
  runningBalance: Record<string, number>;
  players: Player[];
  payments: PaymentRecord[];
  onMarkPaid: (id: string) => void;
  onUndoPayment: (id: string) => void;
}) {
  const transfers = useMemo(
    () => optimizeTransfers(runningBalance, players),
    [runningBalance, players]
  );

  const paidMap = useMemo(
    () => new Map(payments.filter((p) => p.status === "paid").map((p) => [p.id, true])),
    [payments]
  );

  const totalOutstanding = transfers.reduce(
    (s, t) => s + (paidMap.has(t.fromPlayerId + "->" + t.toPlayerId) ? 0 : t.amount),
    0
  );

  function isEmptyBalance(): boolean {
    return players.every((p) => Math.abs(runningBalance[p.id] ?? 0) < 1e-9);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Running balances */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {players.map((p) => {
          const bal = runningBalance[p.id] ?? 0;
          return (
            <div key={p.id} className="glass p-3">
              <div className="flex items-center gap-2">
                <BallDot color={p.color as any} />
                <span className="truncate text-sm">{p.nickname}</span>
              </div>
              <div
                className={`mt-1 text-xl font-bold tabular-nums ${
                  bal > 0 ? "text-primary" : bal < 0 ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {bal > 0 ? "+" : ""}
                {formatMoney(bal)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transfers */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Who pays whom
          </h3>
          <Badge variant={totalOutstanding > 0 ? "gold" : "success"}>
            {totalOutstanding > 0 ? `${formatMoney(totalOutstanding)} outstanding` : "settled"}
          </Badge>
        </div>

        {transfers.length === 0 ? (
          <div className="glass p-6 text-center text-sm text-muted-foreground">
            Everything balanced. No payments needed 🎉
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {transfers.map((t, i) => {
              const key = `${t.fromPlayerId}->${t.toPlayerId}`;
              const paid = paidMap.has(key);
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`glass flex items-center gap-3 p-3 ${paid ? "opacity-50" : ""}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-semibold">{t.fromName}</span>
                      <span className="text-muted-foreground">pays</span>
                      <span className="font-semibold">{t.toName}</span>
                    </div>
                    <div className="text-lg font-bold tabular-nums text-gold">{formatMoney(t.amount)}</div>
                  </div>
                  <Button
                    variant={paid ? "outline" : "default"}
                    size="sm"
                    onClick={() => (paid ? onUndoPayment(key) : onMarkPaid(key))}
                  >
                    {paid ? <Check size={14} /> : <CreditCard size={14} />}
                    {paid ? "Undo" : "Pay"}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Copy-to-clipboard + PromptPay share helper */
export function PaymentActions({ transfers }: { transfers: SettlementInstruction[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  }
  return (
    <div className="flex flex-wrap gap-2">
      {transfers.map((t) => (
        <Button
          key={t.fromPlayerId + t.toPlayerId}
          variant="glass"
          size="sm"
          onClick={() => copy(`${t.fromName} pays ${t.toName} ${formatNumber(t.amount)}฿`, t.fromPlayerId)}
        >
          {copied === t.fromPlayerId ? <Check size={14} /> : <Copy size={14} />}
          Copy line
        </Button>
      ))}
    </div>
  );
}