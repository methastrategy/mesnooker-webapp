"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Play, Timer, Trophy } from "lucide-react";
import { useGameStore, useRunningBalance } from "@/store/gameStore";
import { GlassCard, Stat, Button } from "@/components/ui";
import { formatMoney } from "@/lib/utils";

export default function DashboardPage() {
  const session = useGameStore((s) => s.session);
  const players = useGameStore((s) => s.players);
  const frames = useGameStore((s) => s.frames);
  const running = useRunningBalance();

  const leaderboard = [...players].sort((a, b) => (running[b.id] ?? 0) - (running[a.id] ?? 0));

  return (
    <div className="flex flex-col gap-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {session ? "Tonight's session in progress" : "Welcome back — start or join a session"}
        </p>
      </motion.div>

      {!session ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass flex flex-col items-center gap-4 p-10 text-center"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Play size={28} />
          </span>
          <div>
            <h2 className="text-xl font-bold">Start a match</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Set up 2–8 players, choose point or ball count, and set your money rate. Scoring and
              settlement is instant.
            </p>
          </div>
          <Link href="/match">
            <Button size="lg">
              <Plus size={18} /> New session
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Active session hero */}
          <GlassCard glow="emerald" className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer size={18} className="text-primary" />
                <span className="font-semibold">Session live</span>
              </div>
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] text-primary">
                frame {frames.length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Stat label="Frame" value={frames.length} />
              <Stat label="Players" value={players.length} />
              <Stat
                label="Rate"
                value={session.moneyRate}
                variant="accent"
                prefix=""
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/match" className="flex-1 sm:flex-none">
                <Button className="w-full">
                  <Play size={16} /> Open live match
                </Button>
              </Link>
              <Link href="/settlement" className="flex-1 sm:flex-none">
                <Button variant="glass" className="w-full">
                  <Trophy size={16} /> Settlement
                </Button>
              </Link>
            </div>
          </GlassCard>

          {/* Money tonight */}
          <GlassCard className="p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Money tonight
            </h3>
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {leaderboard.map((p) => (
                <Stat key={p.id} label={p.nickname} value={running[p.id] ?? 0} variant="money" />
              ))}
            </div>
          </GlassCard>

          {/* Leaderboard */}
          <GlassCard className="p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Leaderboard
            </h3>
            <div className="flex flex-col gap-2">
              {leaderboard.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
                  <span className={`w-6 text-center font-bold ${i === 0 ? "text-gold" : "text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium">{p.nickname}</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      (running[p.id] ?? 0) > 0 ? "text-primary" : (running[p.id] ?? 0) < 0 ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {(running[p.id] ?? 0) > 0 ? "+" : ""}
                    {formatMoney(running[p.id] ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}