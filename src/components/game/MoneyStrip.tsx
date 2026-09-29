"use client";

import { TrendingUp, TrendingDown, Minus as FlatIcon, Coins } from "lucide-react";
import type { Player } from "@/types";
import { AnimatedNumber } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { cn } from "@/lib/utils";

/** Compact per-player running-money rail. Always visible so the money
 *  narrative (the heart of a money game) never hides behind a toggle.
 *  Rail variant: shows trend arrows (↑ winning / ↓ losing / — flat). */
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
      <div className="flex flex-col gap-2 rounded-[22px] border border-border/80 bg-card/85 p-3.5 sm:p-4 shadow-md backdrop-blur-md">
        <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Coins size={14} className="text-gold" />
          <span>Money tonight</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {players.map((p) => {
            const v = balances[p.id] ?? 0;
            const color =
              v === 0
                ? "text-muted-foreground"
                : v > 0
                  ? "text-primary"
                  : "text-destructive";
            const TrendIcon =
              v > 0 ? TrendingUp : v < 0 ? TrendingDown : FlatIcon;
            const trendColor =
              v > 0 ? "text-primary" : v < 0 ? "text-destructive" : "text-muted-foreground/40";

            return (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-2.5 rounded-full px-3 py-2 transition-all border",
                  p.id === activeId
                    ? "bg-primary/10 border-primary/40 ring-1 ring-primary/30"
                    : "bg-surface/80 border-border/70"
                )}
              >
                <AvatarBubble avatar={p.avatar} size={22} />
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground/90">
                  {p.nickname}
                </span>
                <TrendIcon
                  size={13}
                  className={cn("shrink-0", trendColor)}
                  aria-hidden
                />
                <span className={cn("text-xs sm:text-sm font-mono font-bold tabular-nums", color)}>
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

  // inline pill strip (mobile) — one compact scrollable row
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
      <span className="shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-gold/15 border border-gold/30 text-gold">
        <Coins size={12} />
      </span>
      {players.map((p) => {
        const v = balances[p.id] ?? 0;
        const color =
          v === 0
            ? "text-muted-foreground"
            : v > 0
              ? "text-primary"
              : "text-destructive";
        const TrendIcon =
          v > 0 ? TrendingUp : v < 0 ? TrendingDown : FlatIcon;

        return (
          <span
            key={p.id}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono tabular-nums shadow-xs",
              p.id === activeId
                ? "border-primary/50 bg-primary/15 text-foreground ring-1 ring-primary/30"
                : "border-border/80 bg-card/80 text-muted-foreground"
            )}
          >
            <TrendIcon
              size={11}
              className={
                v > 0
                  ? "text-primary"
                  : v < 0
                    ? "text-destructive"
                    : "text-muted-foreground/40"
              }
              aria-hidden
            />
            <span className="font-semibold text-foreground/90">{p.nickname}</span>
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