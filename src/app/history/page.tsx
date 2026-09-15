"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Trophy, History as HistoryIcon, Filter, Users, ArrowRight } from "lucide-react";
import { useHistory } from "@/store/gameStore";
import { GlassCard, Badge, Button, BallDot } from "@/components/ui";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { formatMoney, formatDateTime } from "@/lib/utils";
import { optimizeTransfers } from "@/lib/money";
import type { ArchivedGame, GameMode } from "@/types";

export default function HistoryPage() {
  const history = useHistory();

  const [playerId, setPlayerId] = useState<string>("all");
  const [mode, setMode] = useState<"all" | GameMode>("all");
  const [date, setDate] = useState<string>("");
  const [query, setQuery] = useState<string>("");

  // Union of all players who ever appeared in an archived game (newest first).
  const allPlayers = useMemo(() => {
    const map = new Map<string, ArchivedGame["players"][number]>();
    for (const g of history) {
      for (const p of g.players) {
        if (!map.has(p.id)) map.set(p.id, p);
      }
    }
    return [...map.values()];
  }, [history]);

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

  return (
    <div className="flex flex-col gap-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <HistoryIcon size={26} className="text-primary" /> History
        </h1>
        <p className="text-sm text-muted-foreground">
          {history.length > 0
            ? `${history.length} finished game(s) · net money per player`
            : "Finished games settle up the table and live here"}
        </p>
      </motion.div>

      <GlassCard className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <select
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              className="h-10 flex-1 min-w-[140px] rounded-xl bg-white/5 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60"
            >
              <option value="all">All players</option>
              {allPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nickname}
                </option>
              ))}
            </select>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "all" | GameMode)}
              className="h-10 flex-1 min-w-[120px] rounded-xl bg-white/5 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60"
            >
              <option value="all">All modes</option>
              <option value="points">Point count</option>
              <option value="balls">Ball count</option>
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 flex-1 min-w-[150px] rounded-xl bg-white/5 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 [color-scheme:dark]"
            />
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by player nickname…"
              className="h-10 w-full rounded-xl bg-white/5 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/60"
            />
          </div>
        </div>
      </GlassCard>

      {groups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass flex flex-col items-center gap-3 p-10 text-center"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <HistoryIcon size={24} />
          </span>
          <p className="text-sm text-muted-foreground">
            {history.length === 0
              ? "No finished games yet — start a match and End game to save it here."
              : "No finished games match these filters."}
          </p>
        </motion.div>
      ) : (
        groups.map((group) => (
          <div key={group.day} className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gold">
              {new Date(group.day).toLocaleDateString("en", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
              <span className="ml-2 text-muted-foreground">{group.games.length} game(s)</span>
            </h2>
            {group.games.map((g) => {
              const rateLabel =
                g.moneyPer === "ball"
                  ? `${formatMoney(g.moneyRate)}/ball`
                  : `${formatMoney(g.moneyRate)}/pt`;
              const paid = optimizeTransfers(g.balances, g.players);
              const shown = paid.slice(0, 2);
              const extra = paid.length - shown.length;
              return (
                <GlassCard key={g.id} glow="emerald" className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={g.mode === "points" ? "default" : "gold"}>
                        {g.mode === "points" ? "Points" : "Balls"}
                      </Badge>
                      <Badge variant="neutral">{rateLabel}</Badge>
                      <Badge variant="info">
                        <Users size={11} /> {g.players.length} players
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDateTime(g.endedAt)}
                    </span>
                  </div>

                  {/* per-player net money */}
                  <div className="mt-3 flex flex-col gap-1.5">
                    {g.players.map((p) => {
                      const net = g.balances[p.id] ?? 0;
                      return (
                        <div key={p.id} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
                          {p.avatar ? (
                            <AvatarBubble avatar={p.avatar} size={26} />
                          ) : (
                            <BallDot color={p.color} size={10} />
                          )}
                          <span className="flex-1 text-sm font-medium">{p.nickname}</span>
                          <span
                            className={`text-sm font-semibold tabular-nums ${
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

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2">
                    <div className="flex flex-col gap-1">
                      {paid.length > 0 ? (
                        <>
                          {shown.map((t, i) => (
                            <span key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <span>{t.fromName}</span>
                              <ArrowRight size={11} className="text-gold" />
                              <span>{t.toName}</span>
                              <span className="font-semibold text-gold">{formatMoney(t.amount)}</span>
                            </span>
                          ))}
                          {extra > 0 && (
                            <span className="text-[11px] text-muted-foreground">
                              +{extra} more transfer(s)
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          Table settled — nobody owes.
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Trophy size={11} className="text-gold" /> {g.totalPoints} pts
                      </span>
                      <span>{g.frames} frame(s)</span>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        ))
      )}

      {groups.length > 0 && (
        <Button
          variant="glass"
          onClick={() => { setDate(""); setQuery(""); setPlayerId("all"); setMode("all"); }}
        >
          <Filter size={16} /> Reset filters
        </Button>
      )}
    </div>
  );
}