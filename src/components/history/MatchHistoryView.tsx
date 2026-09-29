"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Trophy,
  History as HistoryIcon,
  Filter,
  Users,
  ArrowRight,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { useHistory, useGameStore } from "@/store/gameStore";
import { Badge, Button } from "@/components/ui";
import { HistorySessionSheet } from "@/components/history/HistorySessionSheet";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { formatMoney, formatDateTime } from "@/lib/utils";
import { optimizeTransfers } from "@/lib/money";
import { t } from "@/lib/i18n";
import type { ArchivedGame, GameMode } from "@/types";

export function MatchHistoryView() {
  const history = useHistory();
  const locale = useGameStore((s) => s.locale);

  const [playerId, setPlayerId] = useState<string>("all");
  const [mode, setMode] = useState<"all" | GameMode>("all");
  const [date, setDate] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [selected, setSelected] = useState<ArchivedGame | null>(null);

  // Union of all players who ever appeared in an archived game
  const allPlayers = useMemo(() => {
    const map = new Map<string, ArchivedGame["players"][number]>();
    for (const g of history) {
      for (const p of g.players) {
        if (!map.has(p.id)) map.set(p.id, p);
      }
    }
    return [...map.values()];
  }, [history]);

  const hasActiveFilters = playerId !== "all" || mode !== "all" || date !== "" || query.trim() !== "";

  const filtered = useMemo(() => {
    return history.filter((g: ArchivedGame) => {
      if (playerId !== "all" && !(playerId in g.balances)) return false;
      if (mode !== "all" && g.mode !== mode) return false;
      if (date) {
        const d = new Date(g.endedAt);
        const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (local !== date) return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const names = g.players.map((p) => p.nickname.toLowerCase()).join(" ");
        if (!names.includes(q)) return false;
      }
      return true;
    });
  }, [history, playerId, mode, date, query]);

  const groups = useMemo(() => {
    const map = new Map<string, ArchivedGame[]>();
    for (const g of filtered) {
      const key = new Date(g.endedAt).toDateString();
      const arr = map.get(key) ?? [];
      arr.push(g);
      map.set(key, arr);
    }
    const sorted = [...map.entries()].sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
    return sorted.map(([day, list]) => ({
      day,
      games: [...list].sort((a, b) => b.endedAt - a.endedAt),
    }));
  }, [filtered]);

  const handleReset = () => {
    setPlayerId("all");
    setMode("all");
    setDate("");
    setQuery("");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Filters Bar — Pro Glass Card */}
      <div className="rounded-[20px] border border-border/80 bg-surface/85 backdrop-blur-xl p-4 flex flex-col gap-3 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Player Filter */}
          <div className="flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3 py-1.5 text-xs shadow-xs">
            <Users size={14} className="text-primary shrink-0" />
            <select
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              className="w-full bg-transparent text-xs text-foreground outline-none cursor-pointer"
            >
              <option value="all" className="bg-card text-foreground">{t("history.filter.allPlayers", locale)}</option>
              {allPlayers.map((p) => (
                <option key={p.id} value={p.id} className="bg-card text-foreground">
                  {p.nickname}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Filter */}
          <div className="flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3 py-1.5 text-xs shadow-xs">
            <Filter size={14} className="text-primary shrink-0" />
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "all" | GameMode)}
              className="w-full bg-transparent text-xs text-foreground outline-none cursor-pointer"
            >
              <option value="all" className="bg-card text-foreground">{t("history.filter.allModes", locale)}</option>
              <option value="points" className="bg-card text-foreground">{t("match.mode.points", locale)}</option>
              <option value="balls" className="bg-card text-foreground">{t("match.mode.balls", locale)}</option>
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3 py-1.5 text-xs shadow-xs">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-xs text-foreground outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Search Input & Reset Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("history.filter.search", locale)}
              className="h-9 w-full rounded-full border border-border/80 bg-card/80 pl-9 pr-3 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/60 shadow-xs"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="flex h-9 items-center gap-1.5 rounded-full border border-border/80 bg-card/80 px-3.5 text-xs font-semibold text-muted-foreground hover:bg-surface hover:text-foreground transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* History List or Empty State */}
      {groups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[10px] border border-border bg-card flex flex-col items-center justify-center gap-3 p-10 text-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-primary/15 text-primary border border-primary/25">
            <HistoryIcon size={22} />
          </span>
          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold text-foreground">
              {history.length === 0 ? "No matches recorded yet" : "No matches match your filter"}
            </div>
            <p className="text-xs text-muted-foreground max-w-sm">
              {history.length === 0
                ? "Start a new snooker game from the 'New Game' tab above to record scores and settlements."
                : "Try clearing filters to see all completed match sessions."}
            </p>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="border border-border">
              <RotateCcw size={14} /> Clear all filters
            </Button>
          )}
        </motion.div>
      ) : (
        groups.map((group) => (
          <div key={group.day} className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-mono uppercase tracking-wider text-gold font-semibold">
                {new Date(group.day).toLocaleDateString("en", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </h3>
              <span className="text-[11px] font-mono text-muted-foreground">
                {group.games.length} {group.games.length > 1 ? "matches" : "match"}
              </span>
            </div>

            {group.games.map((g) => {
              const rateLabel =
                g.moneyPer === "ball"
                  ? `${formatMoney(g.moneyRate)}/ball`
                  : `${formatMoney(g.moneyRate)}/pt`;
              const paid = optimizeTransfers(g.balances, g.players);
              const shown = paid.slice(0, 2);
              const extra = paid.length - shown.length;
              const openDetails = () => setSelected(g);

              return (
                <div
                  key={g.id}
                  onClick={openDetails}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openDetails();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="rounded-[10px] border border-border bg-card p-3.5 sm:p-4 transition-all hover:border-primary/40 hover:bg-card/90 cursor-pointer flex flex-col gap-3 group text-left"
                >
                  {/* Top row: tags & timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={g.mode === "points" ? "default" : "gold"}>
                        {g.mode === "points" ? "Points" : "Balls"}
                      </Badge>
                      <Badge variant="neutral">{rateLabel}</Badge>
                      <Badge variant="info">
                        <Users size={11} /> {g.players.length}
                      </Badge>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {formatDateTime(g.endedAt)}
                    </span>
                  </div>

                  {/* Player Net Balances */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {g.players.map((p) => {
                      const net = g.balances[p.id] ?? 0;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-[8px] bg-surface border border-border/60 px-2.5 py-1.5"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <AvatarBubble avatar={p.avatar} size={20} />
                            <span className="text-xs font-medium text-foreground truncate">{p.nickname}</span>
                          </div>
                          <span
                            className={`text-xs font-mono font-semibold tabular-nums shrink-0 ${
                              net > 0 ? "text-primary" : net < 0 ? "text-destructive" : "text-muted-foreground"
                            }`}
                          >
                            {net > 0 ? "+" : ""}
                            {formatMoney(net)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom row: Settlement summary + details cue */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
                      {paid.length > 0 ? (
                        <>
                          {shown.map((t, i) => (
                            <span key={i} className="flex items-center gap-1 text-[11px]">
                              <span>{t.fromName}</span>
                              <ArrowRight size={10} className="text-gold" />
                              <span>{t.toName}</span>
                              <span className="font-semibold text-gold">{formatMoney(t.amount)}</span>
                            </span>
                          ))}
                          {extra > 0 && <span>+{extra} more</span>}
                        </>
                      ) : (
                        <span>Table settled evenly</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-muted-foreground font-mono">
                        <Trophy size={11} className="text-gold" /> {g.totalPoints} pts · {g.frames} frame{g.frames > 1 ? "s" : ""}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-primary font-semibold group-hover:translate-x-0.5 transition-transform">
                        Details <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}

      {/* Drill-down sheet for selected session */}
      <HistorySessionSheet game={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
