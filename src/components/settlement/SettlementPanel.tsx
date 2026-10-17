"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, CreditCard, Copy, ArrowRight, QrCode } from "lucide-react";
import type { Player } from "@/types";
import { optimizeTransfers, type SettlementInstruction } from "@/lib/money";
import { Badge, Button } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { formatMoney, formatNumber } from "@/lib/utils";
import { PromptPayModal } from "./PromptPayModal";

export interface PaymentRecord {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
  status: "paid" | "pending";
}

/** Settlement panel: who pays whom (minimal transfers), mark paid, PromptPay QR, running balance */
export function SettlementPanel({
  runningBalance,
  players,
  payments,
  onMarkPaid,
  onUndoPayment,
  onUpdatePromptPay,
}: {
  runningBalance: Record<string, number>;
  players: Player[];
  payments: PaymentRecord[];
  onMarkPaid: (id: string) => void;
  onUndoPayment: (id: string) => void;
  onUpdatePromptPay?: (playerId: string, promptpayId: string) => void;
}) {
  const [activePromptPay, setActivePromptPay] = useState<SettlementInstruction | null>(null);
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

  const activeRecipient = activePromptPay ? playerMap.get(activePromptPay.toPlayerId) : null;
  const activeDebtor = activePromptPay ? playerMap.get(activePromptPay.fromPlayerId) : undefined;

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
                      <span className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[65px] xs:max-w-[90px] sm:max-w-none">
                        {t.fromName}
                      </span>
                    </div>

                    <ArrowRight size={12} className="text-gold shrink-0" />

                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                      {toP && <AvatarBubble avatar={toP.avatar} size={22} />}
                      <span className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[65px] xs:max-w-[90px] sm:max-w-none">
                        {t.toName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <span className="rounded-full bg-gold/15 border border-gold/35 px-2 sm:px-3 py-0.5 sm:py-1 font-mono font-bold tabular-nums text-gold text-xs sm:text-sm">
                      {formatMoney(t.amount)}
                    </span>

                    {/* PromptPay QR Button */}
                    {!paid && (
                      <Button
                        variant="glass"
                        size="sm"
                        className="rounded-full h-9 sm:h-10 px-2.5 sm:px-3 text-xs text-primary border-primary/30 hover:border-primary/60 hover:bg-primary/10 gap-1"
                        onClick={() => setActivePromptPay(t)}
                        title="สร้าง QR พร้อมเพย์ สแกนจ่าย"
                      >
                        <QrCode size={14} className="shrink-0" />
                        <span className="hidden xs:inline font-mono font-bold">QR</span>
                      </Button>
                    )}

                    <Button
                      variant={paid ? "outline" : "default"}
                      size="sm"
                      className="rounded-full h-9 sm:h-10 px-3.5 sm:px-4 text-xs sm:text-sm font-semibold"
                      onClick={() => (paid ? onUndoPayment(key) : onMarkPaid(key))}
                    >
                      {paid ? <Check size={14} /> : <CreditCard size={14} />}
                      <span>{paid ? "Paid" : "Pay"}</span>
                    </Button>
                  </div>
                </motion.div>
              );
            })}
            {transfers.length > 0 && (
              <PaymentActions
                transfers={transfers}
                onSelectPromptPay={(t) => setActivePromptPay(t)}
              />
            )}
          </div>
        )}
      </div>

      {/* PromptPay Modal */}
      {activePromptPay && activeRecipient && (
        <PromptPayModal
          isOpen={true}
          onClose={() => setActivePromptPay(null)}
          fromPlayer={activeDebtor}
          toPlayer={activeRecipient}
          amount={activePromptPay.amount}
          onMarkPaid={() => {
            onMarkPaid(`${activePromptPay.fromPlayerId}->${activePromptPay.toPlayerId}`);
          }}
          onUpdatePromptPay={onUpdatePromptPay}
        />
      )}
    </div>
  );
}

/** Copy-to-clipboard + PromptPay share helper */
export function PaymentActions({
  transfers,
  onSelectPromptPay,
}: {
  transfers: SettlementInstruction[];
  onSelectPromptPay?: (t: SettlementInstruction) => void;
}) {
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
          <div key={key} className="flex items-center gap-1">
            <Button
              variant="glass"
              size="sm"
              className="rounded-full h-9 sm:h-10 px-3.5 sm:px-4 text-xs sm:text-sm font-mono"
              onClick={() => copy(`${t.fromName} pays ${t.toName} ${formatNumber(t.amount)}฿`, key)}
            >
              {copied === key ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
              <span>Copy {t.fromName} → {t.toName}</span>
            </Button>
            {onSelectPromptPay && (
              <Button
                variant="glass"
                size="sm"
                className="rounded-full h-9 sm:h-10 w-9 sm:w-10 p-0 text-primary border-primary/30 hover:border-primary/60"
                onClick={() => onSelectPromptPay(t)}
                title={`PromptPay QR ${t.fromName} → ${t.toName}`}
              >
                <QrCode size={14} />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}