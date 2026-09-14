"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Trophy, History as HistoryIcon, Filter } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { GlassCard, Badge, Button, BallDot } from "@/components/ui";
import { formatMoney, formatDateTime } from "@/lib/utils";
import type { GameMode } from "@/types";

export default function HistoryPage() {
  const players = useGameStore((s) => s.players);
  const frames = useGameStore((s) => s.frames);
  const session = useGameStore((s) => s.session);

  const [playerId, setPlayerId] = useState<string>("all");
  const [mode, setMode] = useState<"all" | GameMode>("all");
  const [date, setDate] = useState<string>("");
  const [query, setQuery] = useState<string>("");

  const byId = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p])),
    [players]
  );

  const filtered = useMemo(() => {
    return frames.filter((f) => {
      if (playerId !== "all" && !(playerId in f.scores)) return false;
      if (mode !== "all" && f.mode !== mode) return false;
      if (date) {
        const d = new Date(f.startedAt);
        const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (local !== date) return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const names = Object.keys(f.scores)
          .map((id) => byId[id]?.nickname ?? id)
          .join(" ")
          .toLowerCase();
        const winner = f.winnerId ? byId[f.winnerId]?.nickname ?? "" : "";
        if (!names.includes(q) && !winner.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [frames, playerId, mode, date, query, byId]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const f of filtered) {
      const key = new Date(f.startedAt).toDateString();
      const arr = map.get(key) ?? [];
      arr.push(f);
      map.set(key, arr);
    }
    const sorted = [...map.entries()].sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
    return sorted.map(([day, list]) => ({
      day,
      frames: [...list].sort((a, b) => b.startedAt - a.startedAt),
    }));
  }, [filtered]);

  return (
    <div className="flex flex-col gap-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <HistoryIcon size={26} className="text-primary" /> History
        </h1>
        <p className="text-sm text-muted-foreground">
          {session ? `${session.players.length} players · ${frames.length} frame(s)` : "Completed frames across all sessions"}
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
              {players.map((p) => (
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
              placeholder="Search by player or winner…"
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
            No frames match. Complete a match to build your history.
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
              <span className="ml-2 text-muted-foreground">{group.frames.length} frame(s)</span>
            </h2>
            {group.frames.map((f) => {
              const sorted = Object.keys(f.scores).sort(
                (a, b) => (f.scores[b] ?? 0) - (f.scores[a] ?? 0)
              );
              const winner = f.winnerId ? byId[f.winnerId] : undefined;
              return (
                <GlassCard key={f.id} glow="emerald" className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={f.mode === "points" ? "default" : "gold"}>
                        {f.mode === "points" ? "Points" : "Balls"}
                      </Badge>
                      {winner && (
                        <Badge variant="success">
                          <Trophy size={11} /> {winner.nickname}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDateTime(f.startedAt)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-1.5">
                    {sorted.map((id, i) => {
                      const p = byId[id];
                      const score = f.scores[id] ?? 0;
                      const money = f.money[id];
                      const isWinner = f.winnerId === id;
                      return (
                        <div key={id} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
                          <span className={`w-5 text-center text-xs font-bold ${i === 0 ? "text-gold" : "text-muted-foreground"}`}>
                            {i + 1}
                          </span>
                          {p && <BallDot color={p.color} size={10} />}
                          <span className="flex-1 text-sm font-medium">{p?.nickname ?? id}</span>
                          <span className="text-sm font-semibold tabular-nums">{score}</span>
                          {money !== undefined && money !== 0 && (
                            <span className={`text-sm font-semibold tabular-nums ${money > 0 ? "text-primary" : "text-destructive"}`}>
                              {money > 0 ? "+" : ""}
                              {formatMoney(money)}
                            </span>
                          )}
                          {isWinner && <Trophy size={14} className="text-gold" />}
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        ))
      )}

      {groups.length > 0 && (
        <Button variant="glass" onClick={() => { setDate(""); setQuery(""); setPlayerId("all"); setMode("all"); }}>
          <Filter size={16} /> Reset filters
        </Button>
      )}
    </div>
  );
}