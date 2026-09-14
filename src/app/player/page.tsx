"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Pencil,
  Check,
  Trophy,
  TrendingUp,
  Activity,
  Award,
  History as HistoryIcon,
} from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { GlassCard, Stat, Badge, Button, BallDot } from "@/components/ui";
import { formatMoney } from "@/lib/utils";

function PlayerInner() {
  const params = useSearchParams();
  const players = useGameStore((s) => s.players);
  const frames = useGameStore((s) => s.frames);
  const renamePlayer = useGameStore((s) => s.renamePlayer);

  const id = params.get("id");
  const player =
    players.find((p) => p.id === id) ?? players[0];

  const aligned = useMemo(() => {
    if (!player) return null;
    const played = frames.filter((f) => player.id in f.scores);
    const won = played.filter((f) => f.winnerId === player.id);
    let money = 0;
    let earned = 0;
    let lost = 0;
    let best = 0;
    for (const f of played) {
      money += f.money?.[player.id] ?? 0;
      if ((f.money?.[player.id] ?? 0) > 0) earned += f.money[player.id];
      else lost += Math.abs(f.money?.[player.id] ?? 0);
      best = Math.max(best, f.breaks?.[player.id] ?? 0);
    }
    return { played: played.length, won: won.length, money, earned, lost, best };
  }, [player, frames]);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(player?.nickname ?? "");
  const switchPlayer = (id: string) => {
    const p = players.find((x) => x.id === id);
    if (p) {
      setName(p.nickname);
      setEditing(false);
    }
  };

  if (!player) {
    return (
      <GlassCard className="flex flex-col items-center gap-3 p-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Users size={24} />
        </span>
        <p className="text-sm text-muted-foreground">No players yet. Start a session to add players.</p>
        <Link href="/match">
          <Button size="sm">New session</Button>
        </Link>
      </GlassCard>
    );
  }

  const accomplishments = [
    { icon: Trophy, label: "Frames won", value: aligned?.won ?? 0 },
    { icon: TrendingUp, label: "Best break", value: Math.max(aligned?.best ?? 0, player.lifetime?.highestBreakLifetime ?? 0) },
    { icon: Activity, label: "Frames played", value: aligned?.played ?? 0 },
    { icon: Award, label: "Sessions", value: player.lifetime?.sessions ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Player selector */}
      {players.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => switchPlayer(p.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                p.id === player.id
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
              }`}
            >
              <BallDot color={p.color} size={8} />
              {p.nickname}
            </button>
          ))}
        </div>
      )}

      {/* Profile header */}
      <GlassCard glow="emerald" className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-4">
          <BallDot color={player.color} size={56} />
          <div className="flex-1 min-w-0">
            {editing ? (
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmed = name.trim();
                  if (trimmed) renamePlayer(player.id, trimmed);
                  setEditing(false);
                }}
              >
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full rounded-xl bg-white/5 px-3 text-lg font-bold outline-none focus:ring-2 focus:ring-primary/60"
                />
                <Button size="iconSm" type="submit" aria-label="Save name">
                  <Check size={16} />
                </Button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="truncate text-2xl font-bold">{player.nickname}</h1>
                <button
                  onClick={() => { setName(player.nickname); setEditing(true); }}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                  aria-label="Edit name"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
          </div>
          <Badge variant="gold">
            <Trophy size={11} /> {aligned?.won ?? 0} wins
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Win rate" value={aligned && aligned.played > 0 ? Math.round((aligned.won / aligned.played) * 100) : 0} suffix="%" />
          <Stat label="Money" value={aligned?.money ?? 0} variant="money" />
          <Stat label="Earned" value={aligned?.earned ?? 0} variant="money" />
          <Stat label="Lost" value={aligned?.lost ?? 0} variant="default" />
        </div>
      </GlassCard>

      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {accomplishments.map((a, i) => (
          <GlassCard key={i} className="p-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <a.icon size={14} className="text-primary" />
              {a.label}
            </div>
            <div className="text-2xl font-bold tabular-nums">{a.value}</div>
          </GlassCard>
        ))}
      </div>

      {/* Per-frame detail */}
      <GlassCard className="p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <HistoryIcon size={16} className="text-primary" /> Recent frames
        </h3>
        {aligned && aligned.played === 0 ? (
          <p className="text-sm text-muted-foreground">No completed frames for this player yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {frames
              .filter((f) => player.id in f.scores)
              .slice(-10)
              .reverse()
              .map((f) => {
                const score = f.scores[player.id] ?? 0;
                const m = f.money?.[player.id];
                const won = f.winnerId === player.id;
                return (
                  <div key={f.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(f.startedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </span>
                    <Badge variant={f.mode === "points" ? "default" : "gold"} className="hidden sm:inline-flex">
                      {f.mode === "points" ? "Pts" : "Balls"}
                    </Badge>
                    <span className="flex-1 text-sm font-semibold tabular-nums">{score}</span>
                    {won && <Trophy size={14} className="text-gold" />}
                    {m !== undefined && m !== 0 && (
                      <span className={`text-xs font-semibold tabular-nums ${m > 0 ? "text-primary" : "text-destructive"}`}>
                        {m > 0 ? "+" : ""}{formatMoney(m)}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default function PlayerPage() {
  return (
    <div className="flex flex-col gap-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Users size={26} className="text-primary" /> Player profile
        </h1>
        <p className="text-sm text-muted-foreground">Select a player to view their record</p>
      </motion.div>
      <Suspense fallback={<GlassCard className="p-10 text-center text-sm text-muted-foreground">Loading player…</GlassCard>}>
        <PlayerInner />
      </Suspense>
    </div>
  );
}