"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Timer, Trophy, ShieldCheck, Zap, History, Target, ArrowRight } from "lucide-react";
import { useGameStore, useRunningBalance } from "@/store/gameStore";
import { Button } from "@/components/ui";
import { formatMoney } from "@/lib/utils";
import { t } from "@/lib/i18n";

/**
 * Dashboard — Raycast Precision Style.
 * High-density macOS-inspired dark workspace with crisp hairline borders.
 */
export default function DashboardPage() {
  const session = useGameStore((s) => s.session);
  const players = useGameStore((s) => s.players);
  const frames = useGameStore((s) => s.frames);
  const locale = useGameStore((s) => s.locale);
  const running = useRunningBalance();

  const leaderboard = [...players].sort((a, b) => (running[b.id] ?? 0) - (running[a.id] ?? 0));

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary">
            {session ? "Match Engine Active" : "Ready for Setup"}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{t("dash.title", locale)}</h1>
        <p className="text-sm text-muted-foreground">
          {session ? t("dash.subtitle.live", locale) : t("dash.subtitle.idle", locale)}
        </p>
      </motion.div>

      {!session ? (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-3"
        >
          {/* Main Action Hero Card (2 cols) */}
          <div className="md:col-span-2 rounded-[10px] border border-border bg-card p-4 sm:p-6 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <Target size={14} className="text-primary" /> Quick Match Engine
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Start a new snooker session</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Set money rates per point or ball, track frame breaks with real-time rotation, and let the PromptPay net ledger settle payouts automatically.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <Link href="/setup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground font-bold hover:bg-primary-hover">
                  <Play size={16} fill="currentColor" /> {t("dash.setTable", locale)}
                </Button>
              </Link>
              <Link href="/solve" className="w-full sm:w-auto">
                <Button variant="ghost" className="w-full sm:w-auto border border-border text-muted-foreground hover:bg-surface">
                  <Zap size={15} className="text-primary" /> AI Ball Escape Solver
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Specs / Engine Feature Card */}
          <div className="rounded-[10px] border border-border bg-card p-4 sm:p-6 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                <ShieldCheck size={14} className="text-primary" /> System Specs
              </div>
              <ul className="flex flex-col gap-2.5 text-xs text-muted-foreground font-mono">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Real-time Multi-player Rotation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Zero-Drift Money Settlement
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Cushion Raycast Vector Physics
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Offline LocalStorage & Sync
                </li>
              </ul>
            </div>

            <Link href="/history" className="text-xs font-mono text-primary hover:underline flex items-center gap-1">
              <History size={13} /> View past match archives <ArrowRight size={11} />
            </Link>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Active session hero — Raycast Telemetry Card */}
          <div className="rounded-[10px] border border-primary/35 bg-primary/5 p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer size={18} className="text-primary" />
                <span className="font-semibold text-foreground">{t("dash.sessionLive", locale)}</span>
              </div>
              <span className="rounded-[6px] bg-primary/15 border border-primary/30 px-2.5 py-0.5 text-[11px] font-mono text-primary">
                {t("dash.frame", locale)} {frames.length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-[8px] bg-surface border border-border p-2.5 sm:p-3 text-center">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">{t("dash.frame", locale)}</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-foreground">{frames.length}</span>
              </div>
              <div className="rounded-[8px] bg-surface border border-border p-2.5 sm:p-3 text-center">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">{t("dash.players", locale)}</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-foreground">{players.length}</span>
              </div>
              <div className="rounded-[8px] bg-surface border border-border p-2.5 sm:p-3 text-center">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">{t("dash.rate", locale)}</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-primary">฿{session.moneyRate}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link href="/match" className="flex-1 sm:flex-none">
                <Button className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary-hover">
                  <Play size={16} fill="currentColor" /> {t("dash.backTable", locale)}
                </Button>
              </Link>
              <Link href="/settlement" className="flex-1 sm:flex-none">
                <Button variant="ghost" className="w-full border border-border text-foreground hover:bg-surface">
                  <Trophy size={16} className="text-gold" /> {t("dash.settlement", locale)}
                </Button>
              </Link>
            </div>
          </div>

          {/* Leaderboard Table Card */}
          <div className="rounded-[10px] border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Live Net Balance Table
              </h3>
              <span className="text-[10px] font-mono text-muted-foreground">Auto-balanced</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {leaderboard.map((p, i) => {
                const bal = running[p.id] ?? 0;
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-[8px] bg-surface border border-border px-3 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-5 shrink-0 text-center font-mono text-xs font-bold ${i === 0 ? "text-gold" : "text-muted-foreground"}`}>
                        #{i + 1}
                      </span>
                      <span className="font-medium text-sm text-foreground truncate">{p.nickname}</span>
                    </div>
                    <span
                      className={`font-mono text-sm font-semibold tabular-nums shrink-0 ${
                        bal > 0 ? "text-primary" : bal < 0 ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      {bal > 0 ? "+" : ""}
                      {formatMoney(bal)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}