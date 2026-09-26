"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Timer, Trophy } from "lucide-react";
import { useGameStore, useRunningBalance } from "@/store/gameStore";
import { GlassCard, Stat, Button } from "@/components/ui";
import { BALL_HEX, BALL_ORDER } from "@/lib/rules";
import { formatMoney } from "@/lib/utils";
import { t } from "@/lib/i18n";

/** Dashboard — the green room: a big baize table when idle (set the table),
 *  a live scoreboard when a session is running. Same data as before, arranged
 *  around the table metaphor instead of a plain stat-card stack. */
export default function DashboardPage() {
  const session = useGameStore((s) => s.session);
  const players = useGameStore((s) => s.players);
  const frames = useGameStore((s) => s.frames);
  const locale = useGameStore((s) => s.locale);
  const running = useRunningBalance();

  const leaderboard = [...players].sort((a, b) => (running[b.id] ?? 0) - (running[a.id] ?? 0));

  return (
    <div className="flex flex-col gap-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">{t("dash.title", locale)}</h1>
        <p className="text-sm text-muted-foreground">
          {session ? t("dash.subtitle.live", locale) : t("dash.subtitle.idle", locale)}
        </p>
      </motion.div>

      {!session ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="table-stage flex flex-col items-center gap-5 p-8 text-center"
        >
          {/* Mini baize under the headline — the table you're about to set */}
          <div className="baize relative h-28 w-full max-w-md rounded-[20px] overflow-hidden">
            <div className="felt-spot" />
            <div className="relative flex flex-wrap items-center justify-center gap-2 py-6">
              {Array.from({ length: 6 }, (_, i) => (
                <span
                  key={i}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-black/75 shadow ${i >= 3 ? "opacity-70" : ""}`}
                  style={{ background: BALL_HEX[BALL_ORDER[i]] }}
                >
                  {i + 1}
                </span>
              ))}
              <span className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-black/75 shadow" style={{ background: BALL_HEX.black }}>
                7
              </span>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold">Start a match</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Two steps — set the rules, then the players. Pick point or ball count,
              name your rate, and the settlement writes itself.
            </p>
          </div>
          <Link href="/setup">
            <Button size="lg">
              <Play size={18} /> {t("dash.setTable", locale)}
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Active session hero — scoreboard rail over the table stage */}
          <GlassCard glow="gold" className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer size={18} className="text-primary" />
                <span className="font-semibold">{t("dash.sessionLive", locale)}</span>
              </div>
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] text-primary">
                {t("dash.frame", locale)} {frames.length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Stat label={t("dash.frame", locale)} value={frames.length} />
              <Stat label={t("dash.players", locale)} value={players.length} />
              <Stat
                label={t("dash.rate", locale)}
                value={session.moneyRate}
                variant="accent"
                suffix={`/${session.moneyPer === "ball" ? "ball" : "pt"}`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/match" className="flex-1 sm:flex-none">
                <Button className="w-full">
                  <Play size={16} /> {t("dash.backTable", locale)}
                </Button>
              </Link>
              <Link href="/settlement" className="flex-1 sm:flex-none">
                <Button variant="glass" className="w-full">
                  <Trophy size={16} /> {t("dash.settlement", locale)}
                </Button>
              </Link>
            </div>
          </GlassCard>

          {/* Leaderboard — money tonight, ranked (single source of truth for
              the session net; avoids duplicating the same numbers twice) */}
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