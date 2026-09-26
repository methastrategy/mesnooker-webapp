"use client";

import { TrendingUp, TrendingDown, Minus as FlatIcon } from "lucide-react";
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
      <div className="flex flex-col gap-2">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          💰 Money tonight
        </div>
        <div className="flex flex-col gap-1">
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
                  "flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors",
                  p.id === activeId
                    ? "bg-primary/[0.08] ring-1 ring-primary/30"
                    : "bg-white/[0.03]"
                )}
              >
                <AvatarBubble avatar={p.avatar} size={22} />
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium">
                  {p.nickname}
                </span>
                <TrendIcon
                  size={13}
                  className={cn("shrink-0", trendColor)}
                  aria-hidden
                />
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

  // inline pill strip (mobile) — one compact scrollable row
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
      <span className="shrink-0 text-[12px]">💰</span>
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
              "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] tabular-nums",
              p.id === activeId
                ? "border-primary/40 bg-white/8 text-foreground"
                : "border-white/10 bg-white/[0.03] text-muted-foreground"
            )}
          >
            <TrendIcon
              size={10}
              className={
                v > 0
                  ? "text-primary"
                  : v < 0
                    ? "text-destructive"
                    : "text-muted-foreground/40"
              }
              aria-hidden
            />
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