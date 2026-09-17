"use client";

import type { Player } from "@/types";
import { BallCounts, GameEvent, GameMode } from "@/types";
import { AnimatedNumber, Badge } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { BALL_NAME, BALL_ORDER } from "@/lib/rules";
import { cn } from "@/lib/utils";

/** Modern frame-details grid — a clean table of the live result, placed in the
 *  right rail on desktop (bottom on mobile). Presents the running score plus
 *  balances as a real table so it reads as a dashboard, not a stack of cards. */
export function FrameDetailsPanel({
  players,
  scores,
  balances,
  activeId,
  potted,
  events,
  mode,
  totalPoints,
  setsPot,
  redsPot,
}: {
  players: Player[];
  scores: Record<string, number>;
  balances: Record<string, number>;
  activeId?: string;
  potted: BallCounts;
  events: GameEvent[];
  mode: GameMode;
  totalPoints: number;
  setsPot: number;
  redsPot: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* summary strip */}
      <div className="grid grid-cols-3 gap-2">
        <SummaryCell label="Total pts" value={totalPoints} accent />
        <SummaryCell label="Sets" value={setsPot} />
        <SummaryCell label="Reds" value={redsPot} />
      </div>

      {/* scoreboard table */}
      <div className="glass overflow-hidden">
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Scoreboard</h3>
          <Badge variant="gold">{mode === "points" ? "per point" : "per ball"}</Badge>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">Player</th>
              <th className="px-3 py-2 text-right font-medium tabular-nums">Pts</th>
              <th className="px-3 py-2 text-right font-medium tabular-nums">Money</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const pts = scores[p.id] ?? 0;
              const bal = balances[p.id] ?? 0;
              const balColor = bal === 0 ? "text-muted-foreground" : bal > 0 ? "text-primary" : "text-destructive";
              const active = p.id === activeId;
              return (
                <tr
                  key={p.id}
                  className={cn(
                    "border-b border-white/[0.03] last:border-0",
                    active ? "bg-white/[0.06]" : "bg-transparent"
                  )}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <AvatarBubble avatar={p.avatar} size={24} />
                      <span className={cn("truncate font-medium", active && "text-primary")}>{p.nickname}</span>
                      {active ? <ActiveDot /> : null}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold tabular-nums">
                    <AnimatedNumber value={pts} />
                  </td>
                  <td className={cn("px-3 py-2.5 text-right font-semibold tabular-nums", balColor)}>
                    {bal > 0 ? "+" : ""}
                    <AnimatedNumber value={bal} prefix="฿" decimals={0} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* potted rack */}
      <div className="glass p-3">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Potted this frame
        </h3>
        <div className="flex flex-wrap gap-2">
          {BALL_ORDER
            .filter((c) => potted[c] > 0)
            .map((c) => (
              <Badge key={c} variant="neutral">
                {BALL_NAME[c]}: {potted[c]}
              </Badge>
            ))}
          {!BALL_ORDER.some((c) => potted[c] > 0) ? (
            <span className="text-xs text-muted-foreground">Nothing potted yet</span>
          ) : null}
        </div>
      </div>

      {/* events (compact, scrollable) */}
      {events.length > 0 ? (
        <div className="glass p-3">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Events</h3>
          <EventRows events={events} />
        </div>
      ) : null}
    </div>
  );
}

function SummaryCell({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="glass p-2.5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("text-xl font-bold tabular-nums leading-tight", accent && "text-gold")}>
        <AnimatedNumber value={value} />
      </div>
    </div>
  );
}

function ActiveDot() {
  return <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />;
}

function EventRows({ events }: { events: GameEvent[] }) {
  const items = [...events].slice(-25).reverse();
  return (
    <div className="flex max-h-52 flex-col gap-1 overflow-y-auto no-scrollbar">
      {items.map((e) => (
        <div key={e.id} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[13px]">
          <span className="min-w-0 flex-1 truncate font-medium">{e.playerName}</span>
          <span className="shrink-0 text-right font-semibold tabular-nums text-muted-foreground">
            {e.type === "pot" && e.ball ? BALL_NAME[e.ball] : e.type.replace("_", " ")}
            {e.points ? ` ${e.points > 0 ? "+" : ""}${e.points}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}