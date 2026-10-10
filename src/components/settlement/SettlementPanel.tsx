"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, CreditCard, Copy, ArrowRight } from "lucide-react";
import type { Player } from "@/types";
import { optimizeTransfers, type SettlementInstruction } from "@/lib/money";
import { Badge, Button } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
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
  const playerMap = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

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

  return (
    <div className="flex flex-col gap-4">
      {/* Running balances */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {players.map((p) => {
          const bal = runningBalance[p.id] ?? 0;
          return (
            <div
              key={p.id}
              className="rounded-[18px] border border-border/80 bg-card/85 backdrop-blur-md p-3.5 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AvatarBubble avatar={p.avatar} size={20} />
                <span className="truncate text-xs font-semibold text-foreground/90">{p.nickname}</span>
              </div>
              <div
                className={`mt-2 text-base sm:text-lg font-black font-mono tabular-nums leading-none ${
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
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
            Settlement Transfers
          </h3>
          <Badge variant={totalOutstanding > 0 ? "gold" : "success"} className="text-xs font-mono font-bold">
            {totalOutstanding > 0 ? `${formatMoney(totalOutstanding)} outstanding` : "Fully Settled"}
          </Badge>
        </div>

        {transfers.length === 0 ? (
          <div className="rounded-[20px] border border-border/80 bg-card/60 p-6 text-center text-sm font-mono text-muted-foreground backdrop-blur-md">
            Everything balanced. No outstanding transfers.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {transfers.map((t, i) => {
              const key = `${t.fromPlayerId}->${t.toPlayerId}`;
              const paid = paidMap.has(key);
              const fromP = playerMap.get(t.fromPlayerId);
              const toP = playerMap.get(t.toPlayerId);

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rounded-[18px] border border-border/80 bg-card/90 backdrop-blur-md flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-3.5 shadow-sm transition-all ${
                    paid ? "opacity-60 bg-surface/50 line-through" : ""
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                      {fromP && <AvatarBubble avatar={fromP.avatar} size={22} />}
                      <span className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[65px] xs:max-w-[90px] sm:max-w-none">{t.fromName}</span>
                    </div>

                    <ArrowRight size={12} className="text-gold shrink-0" />

                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                      {toP && <AvatarBubble avatar={toP.avatar} size={22} />}
                      <span className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[65px] xs:max-w-[90px] sm:max-w-none">{t.toName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <span className="rounded-full bg-gold/15 border border-gold/35 px-2 sm:px-3 py-0.5 sm:py-1 font-mono font-bold tabular-nums text-gold text-xs sm:text-sm">
                      {formatMoney(t.amount)}
                    </span>

                    <Button
                      variant={paid ? "outline" : "default"}
                      size="sm"
                      className="rounded-full h-7 sm:h-8 px-2.5 sm:px-3 text-[11px] sm:text-xs font-semibold"
                      onClick={() => (paid ? onUndoPayment(key) : onMarkPaid(key))}
                    >
                      {paid ? <Check size={12} /> : <CreditCard size={12} />}
                      <span>{paid ? "Paid" : "Pay"}</span>
                    </Button>
                  </div>
                </motion.div>
              );
            })}
            {transfers.length > 0 && <PaymentActions transfers={transfers} />}
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
    <div className="flex flex-wrap gap-2 pt-2">
      {transfers.map((t) => {
        const key = `${t.fromPlayerId}->${t.toPlayerId}`;
        return (
          <Button
            key={key}
            variant="glass"
            size="sm"
            className="rounded-full text-xs font-mono"
            onClick={() => copy(`${t.fromName} pays ${t.toName} ${formatNumber(t.amount)}฿`, key)}
          >
            {copied === key ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
            <span>Copy {t.fromName} → {t.toName}</span>
          </Button>
        );
      })}
    </div>
  );
}