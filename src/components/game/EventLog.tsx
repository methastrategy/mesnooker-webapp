"use client";

import type { GameEvent } from "@/types";
import { BALL_NAME } from "@/lib/rules";
import { BallDot } from "@/components/ui/snooker-ball";
import { cn } from "@/lib/utils";

const TYPE_META: Record<string, { label: string; cls: string }> = {
  pot: { label: "pot", cls: "text-primary" },
  foul: { label: "foul", cls: "text-destructive" },
  snooker_miss: { label: "snooker miss", cls: "text-destructive" },
  snooker_hit: { label: "snooker hit", cls: "text-gold" },
  end_turn: { label: "end turn", cls: "text-muted-foreground" },
};

export function EventLog({
  events,
  max = 40,
  className,
}: {
  events: GameEvent[];
  max?: number;
  className?: string;
}) {
  if (!events.length)
    return (
      <div className={cn("py-8 text-center text-sm text-muted-foreground", className)}>
        No shots yet. Tap a ball to start scoring.
      </div>
    );

  const items = events.slice(-max).reverse();
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {items.map((e) => {
        const meta = TYPE_META[e.type] ?? TYPE_META.pot;
        return (
          <div
            key={e.id}
            className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2 text-sm"
          >
            {e.type === "pot" && e.ball ? <BallDot color={e.ball} /> : null}
            <div className="min-w-0 flex-1">
              <span className="font-medium">{e.playerName}</span>
              <span className="mx-1 text-muted-foreground">
                {e.targetName ? `vs ${e.targetName}` : ""}
              </span>
            </div>
            <span className={cn("text-sm font-semibold tabular-nums", meta.cls)}>
              {e.points > 0 ? "+" : ""}
              {e.points}
            </span>
            {e.ball ? (
              <span className="text-[10px] text-muted-foreground">{BALL_NAME[e.ball]}</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}