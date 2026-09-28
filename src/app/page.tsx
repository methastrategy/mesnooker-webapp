"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Timer, Trophy, ShieldCheck, Zap, History, Target, ArrowRight } from "lucide-react";
import { useGameStore, useRunningBalance } from "@/store/gameStore";
import { Button } from "@/components/ui";
import { formatMoney } from "@/lib/utils";
import { t } from "@/lib/i18n";

/**
 * Dashboard — Supabase Dark Matrix Style.
 * Technical, high-density, graphite cards with electric emerald accents.
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
          <span className="h-2 w-2 rounded-full bg-[#3ecf8e] animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#3ecf8e]">
            {session ? "Match Engine Active" : "Ready for Setup"}
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">{t("dash.title", locale)}</h1>
        <p className="text-sm text-zinc-400">
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
          <div className="md:col-span-2 rounded-xl border border-white/[0.08] bg-[#171717] p-6 flex flex-col justify-between gap-6 shadow-md">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400">
                <Target size={14} className="text-[#3ecf8e]" /> Quick Match Engine
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Start a new snooker session</h2>
              <p className="text-sm leading-relaxed text-zinc-400">
                Set money rates per point or ball, track frame breaks with real-time rotation, and let the PromptPay net ledger settle payouts automatically.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/setup">
                <Button size="lg" className="bg-[#3ecf8e] text-zinc-950 font-bold hover:bg-[#4ade80] active:bg-[#24b47e] shadow-sm">
                  <Play size={16} fill="currentColor" /> {t("dash.setTable", locale)}
                </Button>
              </Link>
              <Link href="/solve">
                <Button variant="ghost" className="border border-white/10 text-zinc-300 hover:bg-white/[0.05]">
                  <Zap size={15} className="text-[#3ecf8e]" /> AI Ball Escape Solver
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Specs / Engine Feature Card */}
          <div className="rounded-xl border border-white/[0.08] bg-[#171717] p-6 flex flex-col justify-between gap-4 shadow-md">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
                <ShieldCheck size={14} className="text-[#3ecf8e]" /> System Specs
              </div>
              <ul className="flex flex-col gap-2.5 text-xs text-zinc-300 font-mono">
                <li className="flex items-center gap-2">
                  <span className="text-[#3ecf8e]">✓</span> Real-time Multi-player Rotation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#3ecf8e]">✓</span> Zero-Drift Money Settlement
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#3ecf8e]">✓</span> Cushion Raycast Vector Physics
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#3ecf8e]">✓</span> Offline LocalStorage & Sync
                </li>
              </ul>
            </div>

            <Link href="/history" className="text-xs font-mono text-[#3ecf8e] hover:underline flex items-center gap-1">
              <History size={13} /> View past match archives <ArrowRight size={11} />
            </Link>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Active session hero — Supabase Telemetry Card */}
          <div className="rounded-xl border border-[#3ecf8e]/35 bg-[#171717] p-5 flex flex-col gap-4 shadow-[0_0_20px_rgba(62,207,142,0.10)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer size={18} className="text-[#3ecf8e]" />
                <span className="font-semibold text-white">{t("dash.sessionLive", locale)}</span>
              </div>
              <span className="rounded-full bg-[#3ecf8e]/15 border border-[#3ecf8e]/30 px-2.5 py-0.5 text-[11px] font-mono text-[#3ecf8e]">
                {t("dash.frame", locale)} {frames.length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block">{t("dash.frame", locale)}</span>
                <span className="text-xl font-bold font-mono text-white">{frames.length}</span>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block">{t("dash.players", locale)}</span>
                <span className="text-xl font-bold font-mono text-white">{players.length}</span>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block">{t("dash.rate", locale)}</span>
                <span className="text-xl font-bold font-mono text-[#3ecf8e]">฿{session.moneyRate}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link href="/match" className="flex-1 sm:flex-none">
                <Button className="w-full bg-[#3ecf8e] text-zinc-950 font-bold hover:bg-[#4ade80]">
                  <Play size={16} fill="currentColor" /> {t("dash.backTable", locale)}
                </Button>
              </Link>
              <Link href="/settlement" className="flex-1 sm:flex-none">
                <Button variant="ghost" className="w-full border border-white/10 text-zinc-300 hover:bg-white/[0.05]">
                  <Trophy size={16} className="text-amber-400" /> {t("dash.settlement", locale)}
                </Button>
              </Link>
            </div>
          </div>

          {/* Leaderboard Table Card */}
          <div className="rounded-xl border border-white/[0.08] bg-[#171717] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Live Net Balance Table
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">Auto-balanced</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {leaderboard.map((p, i) => {
                const bal = running[p.id] ?? 0;
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.05] px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className={`w-5 text-center font-mono text-xs font-bold ${i === 0 ? "text-amber-400" : "text-zinc-500"}`}>
                        #{i + 1}
                      </span>
                      <span className="font-medium text-sm text-white">{p.nickname}</span>
                    </div>
                    <span
                      className={`font-mono text-sm font-semibold tabular-nums ${
                        bal > 0 ? "text-[#3ecf8e]" : bal < 0 ? "text-rose-400" : "text-zinc-500"
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