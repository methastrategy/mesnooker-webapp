"use client";

import { Wallet } from "lucide-react";
import type { Player } from "@/types";
import { AnimatedNumber } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { cn } from "@/lib/utils";

/** Compact per-player running-money rail. Always visible so the money
 *  narrative (the heart of a money game) never hides behind a toggle. */
export function MoneyStrip({
  players,
  balances,
  activeId,
  variant = "inline",
}: {
  players: Player[];
  balances: Record<string, number>;
  activeId?: string;
  variant?: "inline" | "rail";
}) {
  if (variant === "rail") {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Money tonight</div>
        <div className="flex flex-col gap-1.5">
          {players.map((p) => {
            const v = balances[p.id] ?? 0;
            const color = v === 0 ? "text-muted-foreground" : v > 0 ? "text-primary" : "text-destructive";
            return (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-2.5 py-1.5",
                  p.id === activeId ? "bg-white/6 ring-1 ring-primary/40" : "bg-white/[0.03]"
                )}
              >
                <AvatarBubble avatar={p.avatar} size={22} />
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{p.nickname}</span>
                <span className={cn("text-[13px] font-bold tabular-nums", color)}>
                  {v > 0 ? "+" : ""}
                  <AnimatedNumber value={v} prefix="฿" decimals={0} />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // inline pill strip (mobile) — one compact row
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      <Wallet size={13} className="shrink-0 text-gold" />
      {players.map((p) => {
        const v = balances[p.id] ?? 0;
        const color = v === 0 ? "text-muted-foreground" : v > 0 ? "text-primary" : "text-destructive";
        return (
          <span
            key={p.id}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] tabular-nums",
              p.id === activeId
                ? "border-primary/40 bg-white/8 text-foreground"
                : "border-white/10 bg-white/[0.03] text-muted-foreground"
            )}
          >
            <span className="font-medium">{p.nickname}</span>
            <span className={cn("font-bold", color)}>
              {v > 0 ? "+" : ""}
              <AnimatedNumber value={v} prefix="฿" decimals={0} />
            </span>
          </span>
        );
      })}
    </div>
  );
}