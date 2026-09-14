"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Trophy,
  TrendingUp,
  AlertTriangle,
  Award,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Cell,
} from "recharts";
import { useGameStore } from "@/store/gameStore";
import { GlassCard, Stat, Badge, BallDot } from "@/components/ui";
import { formatMoney } from "@/lib/utils";
import type { Player } from "@/types";

const COLORS = {
  emerald: "#16c784",
  gold: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  pink: "#ec4899",
  grey: "#8a8f8c",
};

export default function StatsPage() {
  const players = useGameStore((s) => s.players);
  const frames = useGameStore((s) => s.frames);
  const session = useGameStore((s) => s.session);

  const stats = useMemo(() => {
    const played = new Map<string, number>();
    const wins = new Map<string, number>();
    const money = new Map<string, number>();
    const fouls = new Map<string, number>();
    const breaks = new Map<string, number>();
    let bestBreak = 0;

    for (const f of frames) {
      for (const id of Object.keys(f.scores)) {
        played.set(id, (played.get(id) ?? 0) + 1);
        if (f.winnerId === id) wins.set(id, (wins.get(id) ?? 0) + 1);
        const m = f.money?.[id] ?? 0;
        money.set(id, (money.get(id) ?? 0) + m);
        fouls.set(id, (fouls.get(id) ?? 0) + (f.fouls?.[id] ?? 0));
        breaks.set(id, Math.max(breaks.get(id) ?? 0, f.breaks?.[id] ?? 0));
        if ((f.breaks?.[id] ?? 0) > bestBreak) bestBreak = f.breaks[id] ?? 0;
      }
    }
    const rows: Array<{
      player: Player;
      frames: number;
      wins: number;
      money: number;
      fouls: number;
      best: number;
    }> = players.map((p) => ({
      player: p,
      frames: played.get(p.id) ?? 0,
      wins: wins.get(p.id) ?? 0,
      money: money.get(p.id) ?? 0,
      fouls: fouls.get(p.id) ?? 0,
      best: breaks.get(p.id) ?? p.lifetime?.highestBreakLifetime ?? 0,
    }));

    const sorted = [...rows].sort((a, b) => b.money - a.money);
    const winRateData = rows
      .filter((r) => r.frames > 0)
      .sort((a, b) => b.wins - a.wins)
      .map((r) => ({
        name: r.player.nickname,
        wins: r.wins,
        winRate: Math.round((r.wins / r.frames) * 100),
      }));

    const foulData = rows
      .filter((r) => r.fouls > 0)
      .map((r) => ({ name: r.player.nickname, fouls: r.fouls }));

    const trend = frames.map((f, i) => {
      const total = Object.values(f.money ?? {}).reduce((a, b) => a + b, 0);
      return { frame: i + 1, money: Math.round(total * 100) / 100 };
    });

    return { rows, sorted, winRateData, foulData, trend, bestBreak };
  }, [players, frames]);

  const topWins = Math.max(0, ...stats.winRateData.map((d) => d.wins));
  const totalFouls = stats.foulData.reduce((a, b) => a + b.fouls, 0);

  const achievements = useMemo(() => {
    const list: Array<{ icon: typeof Trophy; label: string; earned: boolean }> = [];
    list.push({ icon: Trophy, label: "Play your first frame", earned: frames.length > 0 });
    list.push({ icon: BarChart3, label: "Win a frame", earned: stats.rows.some((r) => r.wins > 0) });
    list.push({ icon: TrendingUp, label: "Turn a profit", earned: stats.rows.some((r) => r.money > 0) });
    list.push({ icon: Award, label: `Break of ${stats.bestBreak}+`, earned: stats.bestBreak >= 8 });
    list.push({ icon: Award, label: "Foul-free frame", earned: totalFouls === 0 && frames.length > 0 });
    return list;
  }, [frames, stats, totalFouls]);

  return (
    <div className="flex flex-col gap-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <BarChart3 size={26} className="text-primary" /> Stats
        </h1>
        <p className="text-sm text-muted-foreground">Lifetime performance & session analytics</p>
      </motion.div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <GlassCard className="p-4">
          <Stat label="Frames" value={frames.length} />
        </GlassCard>
        <GlassCard className="p-4">
          <Stat label="Players" value={players.length} />
        </GlassCard>
        <GlassCard className="p-4">
          <Stat label="Best break" value={stats.bestBreak} variant="accent" />
        </GlassCard>
        <GlassCard className="p-4">
          <Stat
            label="Total fouls"
            value={totalFouls}
            variant="default"
          />
        </GlassCard>
      </div>

      {/* Leaderboard */}
      <GlassCard glow="gold" className="p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Trophy size={16} className="text-gold" /> Leaderboard
        </h3>
        <div className="flex flex-col gap-2">
          {stats.sorted.map((r, i) => (
            <div key={r.player.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
              <span className={`w-6 text-center font-bold ${i === 0 ? "text-gold" : "text-muted-foreground"}`}>
                {i + 1}
              </span>
              <BallDot color={r.player.color} size={10} />
              <span className="flex-1 font-medium">{r.player.nickname}</span>
              <span className="hidden text-xs text-muted-foreground sm:block">
                {r.wins}/{r.frames} won
              </span>
              <span className={`font-semibold tabular-nums ${r.money > 0 ? "text-primary" : r.money < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {r.money > 0 ? "+" : ""}
                {formatMoney(r.money)}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Win rate chart */}
      {stats.winRateData.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Win rate
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">Frames won per player</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.winRateData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke={COLORS.grey} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke={COLORS.grey} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={{ background: "#101312", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#f3f7f4", fontSize: 12 }}
                />
                <Bar dataKey="wins" radius={[8, 8, 0, 0]} maxBarSize={36}>
                  {stats.winRateData.map((d, i) => (
                    <Cell key={i} fill={d.wins === topWins && topWins > 0 ? COLORS.gold : COLORS.emerald} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      {/* Money trend */}
      {stats.trend.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Money trend
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">Net money change per frame</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trend} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="frame" stroke={COLORS.grey} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={COLORS.grey} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#101312", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#f3f7f4", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="money"
                  stroke={COLORS.emerald}
                  strokeWidth={2}
                  dot={{ r: 3, fill: COLORS.gold, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      {/* Foul breakdown */}
      {stats.foulData.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <AlertTriangle size={16} className="text-destructive" /> Foul breakdown
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.foulData.map((d) => (
              <Badge key={d.name} variant="danger">
                {d.name} · {d.fouls}
              </Badge>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Achievements */}
      <GlassCard className="p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Award size={16} className="text-gold" /> Achievements
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {achievements.map((a, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                a.earned ? "bg-primary/10 text-foreground" : "bg-white/[0.03] text-muted-foreground"
              }`}
            >
              <a.icon size={16} className={a.earned ? "text-gold" : "text-muted-foreground/50"} />
              <span className="text-sm">{a.label}</span>
              <span className="ml-auto text-xs">
                {a.earned ? (
                  <Badge variant="success">unlocked</Badge>
                ) : (
                  <Badge variant="neutral">locked</Badge>
                )}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {session?.status === "live" && (
        <div className="text-center text-xs text-muted-foreground">
          Session in progress — figures update live as you play.
        </div>
      )}
    </div>
  );
}