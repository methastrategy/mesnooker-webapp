"use client";

import type { Player } from "@/types";
import { BallCounts, GameEvent, GameMode } from "@/types";
import { AnimatedNumber, Badge } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { BALL_NAME, BALL_ORDER, BALL_HEX } from "@/lib/rules";
import { cn } from "@/lib/utils";

/** Modern frame-details grid — a clean table of the live result, placed in the
 *  right rail on desktop (bottom on mobile). Presents the running score plus
 *  balances as a real table so it reads as a dashboard, not a stack of cards.
 *  Now includes rank badges, fouls column, and active-shooter highlight ring. */
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
  // Sort players by score desc to compute ranks (for badges)
  const ranked = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
  const rankOf = (id: string) => ranked.findIndex((p) => p.id === id) + 1;

  // Count fouls per player from events
  const foulCount: Record<string, number> = {};
  for (const e of events) {
    if (e.type === "foul") foulCount[e.playerId] = (foulCount[e.playerId] ?? 0) + 1;
  }

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
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Scoreboard
          </h3>
          <Badge variant="gold">{mode === "points" ? "per point" : "per ball"}</Badge>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">Player</th>
              <th className="px-3 py-2 text-right font-medium tabular-nums">Pts</th>
              <th className="px-3 py-2 text-right font-medium tabular-nums">Fouls</th>
              <th className="px-3 py-2 text-right font-medium tabular-nums">Money</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const pts = scores[p.id] ?? 0;
              const bal = balances[p.id] ?? 0;
              const fouls = foulCount[p.id] ?? 0;
              const balColor =
                bal === 0
                  ? "text-muted-foreground"
                  : bal > 0
                    ? "text-primary"
                    : "text-destructive";
              const active = p.id === activeId;
              const rank = rankOf(p.id);
              const isLeading = rank === 1 && pts > 0;

              return (
                <tr
                  key={p.id}
                  className={cn(
                    "border-b border-white/[0.03] last:border-0 transition-colors",
                    active
                      ? "bg-primary/[0.08] ring-inset ring-1 ring-primary/20"
                      : "bg-transparent"
                  )}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {/* Rank badge */}
                      <span
                        className={cn(
                          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums",
                          rank === 1 && pts > 0
                            ? "bg-gold text-black"
                            : rank === 2
                              ? "bg-white/20 text-foreground/80"
                              : "bg-white/8 text-muted-foreground"
                        )}
                      >
                        {rank}
                      </span>
                      <AvatarBubble avatar={p.avatar} size={24} />
                      <span
                        className={cn(
                          "truncate font-medium",
                          active && "text-primary font-semibold"
                        )}
                      >
                        {p.nickname}
                      </span>
                      {active && <ActiveShooterDot />}
                      {isLeading && !active && (
                        <span className="text-gold text-[11px]">🏆</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold tabular-nums">
                    <AnimatedNumber value={pts} />
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {fouls > 0 ? (
                      <span className="text-destructive/80 text-xs font-semibold">
                        {fouls}×
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2.5 text-right font-semibold tabular-nums",
                      balColor
                    )}
                  >
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
          {BALL_ORDER.filter((c) => potted[c] > 0).map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums"
              style={{ borderColor: `${BALL_HEX[c]}40` }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: BALL_HEX[c] }}
              />
              {BALL_NAME[c]} ×{potted[c]}
            </span>
          ))}
          {!BALL_ORDER.some((c) => potted[c] > 0) ? (
            <span className="text-xs text-muted-foreground">Nothing potted yet</span>
          ) : null}
        </div>
      </div>

      {/* events (compact, scrollable) */}
      {events.length > 0 ? (
        <div className="glass p-3">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Events
          </h3>
          <EventRows events={events} />
        </div>
      ) : null}
    </div>
  );
}

function SummaryCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="glass p-2.5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={cn(
          "text-xl font-bold tabular-nums leading-tight",
          accent && "text-gold"
        )}
      >
        <AnimatedNumber value={value} />
      </div>
    </div>
  );
}

function ActiveShooterDot() {
  return (
    <span
      className="ml-0.5 inline-flex h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse"
      aria-label="Currently shooting"
    />
  );
}

/** Event type → emoji + label map for quick visual scanning */
const EVENT_ICONS: Record<string, string> = {
  pot: "🎱",
  foul: "🚫",
  snooker_miss: "❌",
  snooker_hit: "✅",
  end_turn: "→",
};

function EventRows({ events }: { events: GameEvent[] }) {
  const items = [...events].slice(-30).reverse();
  return (
    <div className="flex max-h-52 flex-col gap-0.5 overflow-y-auto no-scrollbar">
      {items.map((e) => {
        const icon = EVENT_ICONS[e.type] ?? "•";
        const isNeg = e.points < 0;
        const isPos = e.points > 0 && e.type !== "end_turn";
        const ballName = e.type === "pot" && e.ball ? BALL_NAME[e.ball] : null;
        return (
          <div
            key={e.id}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-1 text-[12px]",
              e.type === "end_turn"
                ? "opacity-40"
                : "bg-white/[0.025]"
            )}
          >
            <span className="shrink-0 text-[11px]">{icon}</span>
            <span className="min-w-0 flex-1 truncate font-medium text-foreground/80">
              {e.playerName}
            </span>
            <span
              className={cn(
                "shrink-0 text-right font-semibold tabular-nums text-[11px]",
                isNeg ? "text-destructive" : isPos ? "text-primary" : "text-muted-foreground"
              )}
            >
              {ballName ?? e.type.replace("_", " ")}
              {e.points !== 0 && e.type !== "end_turn"
                ? ` ${e.points > 0 ? "+" : ""}${e.points}`
                : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}