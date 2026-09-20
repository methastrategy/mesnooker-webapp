"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Trophy,
  TrendingUp,
  Award,
  Coins,
  Crown,
  Flame,
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
import { useHistory } from "@/store/gameStore";
import { GlassCard, Stat, Badge, BallDot } from "@/components/ui";
import { formatMoney } from "@/lib/utils";
import type { Player } from "@/types";

const COLORS = {
  emerald: "#d9a441",
  gold: "#f0c25c",
  red: "#e8534a",
  blue: "#3b82f6",
  pink: "#ec4899",
  grey: "#9aa58f",
};

interface AggRow {
  player: Player;
  games: number;
  net: number;
  pointsAsWinner: number;
  wins: number;
  highestNet: number;
}

export default function StatsPage() {
  const history = useHistory();

  const { rows, sorted, netData, trendData, topWins, bestSingleNet, totalPoints, totalPlayers } =
    useMemo(() => {
      // Player roster: union of archived players, meta from newest appearance.
      const meta = new Map<string, Player>();
      for (const g of history) {
        for (const p of g.players) if (!meta.has(p.id)) meta.set(p.id, p);
      }

      const played = new Map<string, number>();
      const net = new Map<string, number>();
      const pointsAsWinner = new Map<string, number>();
      const wins = new Map<string, number>();
      const highestNet = new Map<string, number>();

      let bestSingleNet = 0;
      let totalPoints = 0;

      for (const g of history) {
        // Net per player for this game.
        for (const [id, bal] of Object.entries(g.balances)) {
          net.set(id, (net.get(id) ?? 0) + bal);
          played.set(id, (played.get(id) ?? 0) + 1);
          highestNet.set(id, Math.max(highestNet.get(id) ?? 0, bal));
          bestSingleNet = Math.max(bestSingleNet, bal);
        }
        // Winner gets the game's total points credited.
        let winnerId: string | null = null;
        let top = -Infinity;
        for (const [id, bal] of Object.entries(g.balances)) {
          if (bal > top) {
            top = bal;
            winnerId = id;
          }
        }
        if (winnerId) {
          wins.set(winnerId, (wins.get(winnerId) ?? 0) + 1);
          pointsAsWinner.set(winnerId, (pointsAsWinner.get(winnerId) ?? 0) + g.totalPoints);
          totalPoints += g.totalPoints;
        }
      }

      const rows: AggRow[] = [...meta.values()].map((player) => {
        const id = player.id;
        return {
          player,
          games: played.get(id) ?? 0,
          net: Math.round((net.get(id) ?? 0) * 100) / 100,
          pointsAsWinner: pointsAsWinner.get(id) ?? 0,
          wins: wins.get(id) ?? 0,
          highestNet: highestNet.get(id) ?? 0,
        };
      });

      const sorted = [...rows].sort((a, b) => b.net - a.net);

      const topWins = Math.max(0, ...rows.map((r) => r.wins));

      const netData = sorted
        .filter((r) => r.games > 0 && r.net !== 0)
        .map((r) => ({ name: r.player.nickname, net: r.net }));

      // Cumulative net per player over game index (newest-first history reversed to chronological).
      const running = new Map<string, number>();
      const trendData: Array<{ game: number; [id: string]: number }> = [];
      [...history].reverse().forEach((g, i) => {
        for (const [id, bal] of Object.entries(g.balances)) {
          running.set(id, Math.round(((running.get(id) ?? 0) + bal) * 100) / 100);
        }
        const point: { game: number; [id: string]: number } = { game: i + 1 };
        for (const [id, v] of running) point[id] = v;
        trendData.push(point);
      });

      const totalPlayers = meta.size;

      return { rows, sorted, netData, trendData, topWins, bestSingleNet, totalPoints, totalPlayers };
    }, [history]);

  const trendLines = (sorted.length > 0 ? sorted : []).slice(0, 5);

  const achievements = useMemo(() => {
    const list: Array<{ icon: typeof Crown; label: string; earned: boolean }> = [];
    list.push({ icon: BarChart3, label: "Finish your first game", earned: history.length > 0 });
    list.push({ icon: Crown, label: "Win a game (settle on top)", earned: topWins > 0 });
    list.push({ icon: TrendingUp, label: "Turn an overall profit", earned: rows.some((r) => r.net > 0) });
    list.push({
      icon: Flame,
      label: "Big single-game net",
      earned: bestSingleNet >= 200,
    });
    const balanced =
      rows.filter((r) => r.games >= 2 && Math.abs(r.net) < (rows[0]?.net ?? 0) * 0.1).length >= 0 &&
      rows.some((r) => r.games >= 2 && Math.abs(r.net) < 50);
    list.push({ icon: Coins, label: "Balanced player (near +0)", earned: balanced });
    return list;
  }, [history, topWins, rows, bestSingleNet]);

  return (
    <div className="flex flex-col gap-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <BarChart3 size={26} className="text-primary" /> Stats
        </h1>
        <p className="text-sm text-muted-foreground">
          Lifetime performance across all finished games
        </p>
      </motion.div>

      {history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass flex flex-col items-center gap-3 p-10 text-center"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <BarChart3 size={24} />
          </span>
          <p className="text-sm text-muted-foreground">
            No finished games yet — start a match and End session to seed your stats here.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Headline stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <GlassCard className="p-4">
              <Stat label="Games" value={history.length} />
            </GlassCard>
            <GlassCard className="p-4">
              <Stat label="Players" value={totalPlayers} />
            </GlassCard>
            <GlassCard className="p-4">
              <Stat label="Points won" value={totalPoints} variant="accent" />
            </GlassCard>
            <GlassCard className="p-4">
              <Stat label="Best single net" value={bestSingleNet} variant="money" />
            </GlassCard>
          </div>

          {/* Leaderboard */}
          <GlassCard glow="gold" className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Trophy size={16} className="text-gold" /> Leaderboard
            </h3>
            <div className="flex flex-col gap-2">
              {sorted.map((r, i) => (
                <div key={r.player.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
                  <span className={`w-6 text-center font-bold ${i === 0 ? "text-gold" : "text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  <BallDot color={r.player.color} size={10} />
                  <span className="flex-1 font-medium">{r.player.nickname}</span>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {r.wins} win(s) · {r.games} game(s)
                  </span>
                  <span className={`font-semibold tabular-nums ${r.net > 0 ? "text-primary" : r.net < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {r.net > 0 ? "+" : ""}
                    {formatMoney(r.net)}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Net money bar chart */}
          {netData.length > 0 && (
            <GlassCard className="p-5">
              <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Net money per player
              </h3>
              <p className="mb-3 text-xs text-muted-foreground">Overall profit across all games</p>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={netData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" stroke={COLORS.grey} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={COLORS.grey} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      contentStyle={{ background: "#101312", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#f3f7f4", fontSize: 12 }}
                    />
                    <Bar dataKey="net" radius={[8, 8, 0, 0]} maxBarSize={36}>
                      {netData.map((d, i) => (
                        <Cell key={i} fill={d.net > 0 ? COLORS.emerald : COLORS.red} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}

          {/* Money trend — needs ≥2 games: a single point has no line to draw */}
          {trendData.length > 1 && trendLines.length > 0 && (
            <GlassCard className="p-5">
              <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Net money over games
              </h3>
              <p className="mb-3 text-xs text-muted-foreground">
                Cumulative running net per player (top {trendLines.length} by balance)
              </p>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="game" stroke={COLORS.grey} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={COLORS.grey} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#101312", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#f3f7f4", fontSize: 12 }}
                    />
                    {trendLines.map((r, i) => (
                      <Line
                        key={r.player.id}
                        type="monotone"
                        dataKey={r.player.id}
                        name={r.player.nickname}
                        stroke={[COLORS.emerald, COLORS.gold, COLORS.blue, COLORS.pink, COLORS.red][i % 5]}
                        strokeWidth={2}
                        dot={{ r: 3, fill: [COLORS.emerald, COLORS.gold, COLORS.blue, COLORS.pink, COLORS.red][i % 5], strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
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
        </>
      )}
    </div>
  );
}