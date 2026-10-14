"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Play,
  Trophy,
  Timer,
  Coins,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Crosshair,
  Sliders,
  ChevronRight,
  Calculator,
  Flame,
  ArrowUpRight,
  History,
  CheckCircle2,
} from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { cn, formatMoney, formatDateTime } from "@/lib/utils";
import { BallDot } from "@/components/ui/snooker-ball";
import type { BallColor } from "@/types";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [calcUnits, setCalcUnits] = useState<number>(20);

  useEffect(() => {
    setMounted(true);
  }, []);

  const session = useGameStore((s) => s.session);
  const frames = useGameStore((s) => s.frames);
  const history = useGameStore((s) => s.history);
  const locale = useGameStore((s) => s.locale);
  const moneyRate = useGameStore((s) => s.moneyRate);
  const moneyPer = useGameStore((s) => s.moneyPer);

  const isLive = mounted && session && session.status === "live" && frames.length > 0;
  const currentFrame = frames[frames.length - 1];
  const recentGame = mounted && history.length > 0 ? history[0] : null;

  // Quick calculator computation
  const calculatedBaht = useMemo(() => {
    return calcUnits * (moneyRate || 1);
  }, [calcUnits, moneyRate]);

  // Extract recent game top winner
  const recentWinnerInfo = useMemo(() => {
    if (!recentGame) return null;
    let topPlayerId = "";
    let maxBalance = -Infinity;
    for (const [pId, bal] of Object.entries(recentGame.balances || {})) {
      if (bal > maxBalance) {
        maxBalance = bal;
        topPlayerId = pId;
      }
    }
    const player = recentGame.players.find((p) => p.id === topPlayerId);
    return {
      player,
      balance: maxBalance,
    };
  }, [recentGame]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-16">
      {/* ── TOP COMPACT COMMAND TOOLBAR ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-0.5 text-[11px] font-mono font-semibold text-amber-300">
              <Sparkles size={12} className="text-amber-400" />
              <span>MESNOOKER PRO</span>
            </span>
            <span className="hidden sm:inline text-border">·</span>
            <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>{locale === "th" ? "ประวัติ" : "Saved"}:</span>
              <span className="font-bold text-foreground">{mounted ? history.length : 0}</span>
            </div>
            <span className="text-border">·</span>
            <div className="flex items-center gap-1 text-muted-foreground font-mono text-[11px]">
              <span>{locale === "th" ? "เรทเดิมพัน" : "Rate"}:</span>
              <span className="font-bold text-amber-400 font-mono">
                ฿{moneyRate}/{moneyPer === "ball" ? (locale === "th" ? "ลูก" : "ball") : (locale === "th" ? "แต้ม" : "point")}
              </span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground font-heading mt-2.5 [text-wrap:balance]">
            {locale === "th" ? "ศูนย์ควบคุมการแข่งขันและเคลียร์เงิน" : "Match Cockpit & Settlement Center"}
          </h1>
        </div>

        {/* Action pills */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/setup"
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/60 bg-gradient-to-r from-amber-500 to-amber-600 px-4.5 py-2.5 text-xs sm:text-sm font-bold text-stone-950 shadow-md transition-all hover:brightness-110 active:scale-[0.97] min-h-[42px]"
          >
            <Play size={14} className="fill-current" />
            <span>{locale === "th" ? "เริ่มเกมใหม่" : "Start New Game"}</span>
          </Link>

          <Link
            href="/match"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface/90 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-card active:scale-[0.97] shadow-xs min-h-[42px]"
          >
            <Timer size={14} className="text-primary" />
            <span>{locale === "th" ? "กระดานสด" : "Live Board"}</span>
          </Link>

          <Link
            href="/settlement"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface/90 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground transition-all hover:border-amber-400/40 hover:bg-card active:scale-[0.97] shadow-xs min-h-[42px]"
          >
            <Coins size={14} className="text-amber-400" />
            <span>{locale === "th" ? "เคลียร์เงิน" : "Settle"}</span>
          </Link>

          <Link
            href="/settings"
            className="inline-flex items-center justify-center rounded-full border border-border/80 bg-surface/90 px-3 py-2.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-all hover:border-primary/40 hover:bg-card active:scale-[0.97] shadow-xs min-h-[42px]"
            title={locale === "th" ? "ตั้งค่าระบบ" : "Preferences"}
          >
            <Sliders size={14} />
          </Link>
        </div>
      </div>

      {/* ── ASYMMETRIC 8:4 BENTO COMMAND CENTER ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* ── LEFT COLUMN (8 OF 12): TELEMETRY + ACTION PODS + RECENT STREAM ── */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-5">
          {/* 1. TELEMETRY POD (Live Session OR Fast Match Launcher) */}
          {isLive ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-[22px] border border-primary/50 bg-surface/95 p-5 sm:p-6 shadow-xl backdrop-blur-xl"
            >
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                    </span>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                      {locale === "th" ? "แมตช์กำลังดำเนินอยู่" : "Live Session Telemetry"}
                    </span>
                    <span className="rounded-full bg-primary/20 border border-primary/30 px-2 py-0.2 text-[10px] font-mono font-bold text-primary">
                      Frame {frames.length}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-foreground font-heading">
                    {session?.players
                      ? session.players.map((p) => p.nickname).filter(Boolean).join(" vs ")
                      : "Active Snooker Match"}
                  </h2>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span>
                      {locale === "th" ? "โหมด" : "Mode"}:{" "}
                      <strong className="text-foreground">
                        {session?.mode === "balls" ? "Ball Count (ไทย)" : "International Points"}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      {locale === "th" ? "ลูกแดง" : "Reds"}:{" "}
                      <strong className="text-foreground">{session?.redCount || 15}</strong>
                    </span>
                    {currentFrame && (
                      <>
                        <span>·</span>
                        <span>
                          {locale === "th" ? "เบรกสูงสุด" : "High Break"}:{" "}
                          <strong className="text-amber-400 font-bold">{currentFrame.highestBreak || 0}</strong>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <Link
                  href="/match"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/60 bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary-hover active:scale-[0.98] shrink-0"
                >
                  <span>{locale === "th" ? "กลับสู่กระดานแข่ง" : "Resume Scoring"}</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="relative overflow-hidden rounded-[22px] border border-border/80 bg-gradient-to-br from-card/90 to-surface/90 p-5 sm:p-6 shadow-md">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-lg">
                  <div className="flex items-center gap-2">
                    <Crosshair size={16} className="text-amber-400" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                      {locale === "th" ? "พร้อมเริ่มเกมใหม่" : "Ready for Break-Off"}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground font-heading [text-wrap:balance]">
                    {locale === "th" ? "ตั้งค่าโต๊ะ เลือกผู้เล่น และเริ่มแข่งขัน" : "Launch Match Wizard"}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed [text-wrap:pretty]">
                    {locale === "th"
                      ? "รองรับผู้เล่น 2–8 คน ระบบนับแต้มสากลหรือนับลูก พร้อมคำนวณเงินรางวัลและหักลบหนี้รอบวงอัตโนมัติ"
                      : "Configure 2–8 players with point or ball rules, custom red ball counts, and money reconciliation."}
                  </p>
                </div>

                <Link
                  href="/setup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-sm font-bold text-stone-950 shadow-md transition-all hover:brightness-110 active:scale-[0.98] shrink-0"
                >
                  <Play size={16} className="fill-current" />
                  <span>{locale === "th" ? "สร้างเกมทันที" : "Configure Table"}</span>
                </Link>
              </div>
            </div>
          )}

          {/* 2. BENTO SUBGRID: 2 TACTICAL ACTION CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* B1: Live Scoreboard Card */}
            <Link
              href="/match"
              className="group relative flex flex-col justify-between overflow-hidden rounded-[20px] border border-border/80 bg-card/85 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 text-primary shadow-xs transition-transform group-hover:scale-105">
                    <Timer size={22} />
                  </div>
                  <span className="rounded-full bg-surface border border-border px-2.5 py-0.5 text-[10px] font-mono font-bold text-muted-foreground group-hover:text-primary transition-colors">
                    {locale === "th" ? "กระดานสด" : "Live Board"}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-foreground font-heading group-hover:text-primary transition-colors">
                    {locale === "th" ? "กระดานคะแนนและแป้นช็อต" : "Tactical Scoreboard"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed [text-wrap:pretty]">
                    {locale === "th"
                      ? "แป้นลูกสนุ๊กเกอร์ 7 สีแถวเดียวไม่บังจอ บันทึกฟาวล์ หลุดสนุ๊กเกอร์ พร้อมระบบ Undo ย้อนหลังไม่จำกัด"
                      : "Ergonomic 7-ball keypad, live break counters, full undo replay, and penalty controls."}
                  </p>
                </div>

                {/* Micro preview rack */}
                <div className="flex items-center gap-1.5 pt-1">
                  {(["red", "yellow", "green", "brown", "blue", "pink", "black"] as BallColor[]).map((c) => (
                    <BallDot key={c} color={c} size={10} />
                  ))}
                  <span className="text-[10px] font-mono text-muted-foreground ml-1">7 Balls</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                <span>{locale === "th" ? "เข้าสู่กระดาน" : "Open Board"}</span>
                <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* B2: Stats & Archive Analytics */}
            <Link
              href="/stats"
              className="group relative flex flex-col justify-between overflow-hidden rounded-[20px] border border-border/80 bg-card/85 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-sky-500/50 hover:shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/15 text-sky-400 shadow-xs transition-transform group-hover:scale-105">
                    <BarChart3 size={22} />
                  </div>
                  <span className="rounded-full bg-surface border border-border px-2.5 py-0.5 text-[10px] font-mono font-bold text-muted-foreground group-hover:text-sky-400 transition-colors">
                    {locale === "th" ? "สถิติ & ประวัติ" : "Analytics"}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-foreground font-heading group-hover:text-sky-400 transition-colors">
                    {locale === "th" ? "สถิติและประวัติการแข่งขัน" : "Match History & Ledger"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed [text-wrap:pretty]">
                    {locale === "th"
                      ? "เก็บบันทึกประวัติแมตช์ สถิติเบรกสูงสุด อัตราชนะ และยอดเงินสุทธิสะสมของผู้เล่นทุกคน"
                      : "Lifetime match archives, highest break milestones, win rates, and financial trends."}
                  </p>
                </div>

                {/* Micro metric display */}
                <div className="flex items-center gap-3 pt-1 text-xs font-mono">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Trophy size={13} className="text-amber-400" />
                    <span>{mounted ? history.length : 0} {locale === "th" ? "แมตช์" : "matches"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Flame size={13} className="text-orange-400" />
                    <span>{locale === "th" ? "บันทึกถาวร" : "Persistent"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-bold text-foreground group-hover:text-sky-400 transition-colors">
                <span>{locale === "th" ? "ดูบทวิเคราะห์" : "View Analytics"}</span>
                <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>

          {/* 3. RECENT MATCH ACTIVITY STREAM */}
          <div className="rounded-[20px] border border-border/80 bg-surface/75 p-5 sm:p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={17} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider font-mono">
                  {locale === "th" ? "ประวัติการแข่งขันล่าสุด" : "Recent Match Stream"}
                </h3>
              </div>
              <Link
                href="/history"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>{locale === "th" ? "ดูทั้งหมด" : "View All"}</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>

            {recentGame ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/70 bg-card/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 text-[10px] font-mono font-bold">
                      {recentGame.mode === "balls" ? "Ball Count" : "Points"}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatDateTime(recentGame.endedAt)}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {recentGame.players.map((p) => p.nickname).join(" vs ")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {recentGame.frames} {locale === "th" ? "เฟรม" : "frames"} · {recentGame.totalPoints || 0} {locale === "th" ? "แต้มรวม" : "total points"}
                  </div>
                </div>

                {recentWinnerInfo?.player && (
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
                    <span className="text-[11px] text-muted-foreground">
                      {locale === "th" ? "ผู้ชนะอันดับ 1" : "Top Earner"}
                    </span>
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400 font-mono text-sm">
                      <span>{recentWinnerInfo.player.nickname}</span>
                      <span>+{formatMoney(recentWinnerInfo.balance)}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground font-mono">
                {locale === "th"
                  ? "ยังไม่มีประวัติการแข่งขันที่จบ — เริ่มต้นแมตช์แรกเพื่อดูสถิติ"
                  : "No finished match records yet. Start a match to populate the stream."}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (4 OF 12): FINANCIAL SETTLEMENT + RATE CALCULATOR ── */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5">
          {/* 1. TABLE NET BALANCE & SETTLEMENT CARD */}
          <div className="relative overflow-hidden rounded-[20px] border border-border/80 bg-card/90 p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-400">
                  <Coins size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground font-heading">
                    {locale === "th" ? "ระบบเคลียร์เงินรอบวง" : "Net Settlement"}
                  </h3>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    PromptPay QR Minimal Transfers
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed [text-wrap:pretty]">
              {locale === "th"
                ? "คำนวณยอดได้เสียรอบวง (Cycle) อัตโนมัติ รวบหนี้เหลือโอนน้อยที่สุด พร้อมสร้าง PromptPay QR ทันที"
                : "Greedy graph algorithm collapses group debts into minimal peer-to-peer bank transfers."}
            </p>

            <Link
              href="/settlement"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-4 py-2.5 text-xs font-bold text-amber-300 transition-all active:scale-[0.98]"
            >
              <span>{locale === "th" ? "เปิดหน้าเคลียร์เงิน" : "Open Settlement Ledger"}</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* 2. QUICK MONEY RATE CALCULATOR POD */}
          <div className="rounded-[20px] border border-border/80 bg-surface/80 p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator size={17} className="text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground font-mono">
                  {locale === "th" ? "คำนวณแต้มเป็นเงินสด" : "Quick Stake Calculator"}
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-amber-400">
                ฿{moneyRate}/{moneyPer === "ball" ? (locale === "th" ? "ลูก" : "ball") : (locale === "th" ? "แต้ม" : "pt")}
              </span>
            </div>

            {/* Quick unit chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[5, 10, 20, 35, 50, 75].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCalcUnits(val)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer",
                    calcUnits === val
                      ? "bg-primary text-primary-foreground font-bold border border-primary/50 shadow-xs"
                      : "bg-surface border border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {val} {moneyPer === "ball" ? (locale === "th" ? "ลูก" : "b") : (locale === "th" ? "แต้ม" : "pt")}
                </button>
              ))}
            </div>

            {/* Result display */}
            <div className="rounded-xl border border-border/60 bg-card/90 p-3.5 flex items-center justify-between">
              <div className="text-xs text-muted-foreground font-mono">
                {calcUnits} × ฿{moneyRate} =
              </div>
              <div className="text-lg font-black font-mono text-amber-400">
                ฿{calculatedBaht.toLocaleString()}
              </div>
            </div>
          </div>

          {/* 3. ENGINE CAPABILITY BADGES */}
          <div className="rounded-[20px] border border-border/80 bg-card/60 p-4.5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>{locale === "th" ? "มาตรฐานระบบ Mesnooker" : "System Architecture"}</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                <span>{locale === "th" ? "ทำงานออฟไลน์ 100% ไม่ต้องใช้อินเทอร์เน็ต" : "100% Offline-First Local Storage"}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                <span>{locale === "th" ? "เข้ารหัสรหัสผ่าน scrypt และ Throttling" : "Scrypt Passwords & Rate Throttling"}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                <span>{locale === "th" ? "ปุ่มกดสรีรศาสตร์แบบ Keycap เด้งรับนิ้ว" : "Tactile Mechanical Keycap Ergonomics"}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── 3-STEP STREAMLINED WORKFLOW ─────────────────────────────────── */}
      <section className="rounded-[22px] border border-border/80 bg-surface/70 p-5 sm:p-7 space-y-4">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">
            {locale === "th" ? "ขั้นตอนการทำงานง่ายๆ" : "Streamlined Snooker Workflow"}
          </span>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-heading mt-1 [text-wrap:balance]">
            {locale === "th" ? "เล่นสนุ๊กเกอร์และเคลียร์เงินใน 3 ขั้นตอน" : "From Break-Off to Bank Transfer"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary font-mono text-xs font-bold">
                1
              </span>
              <span className="text-xs font-bold text-foreground font-heading">
                {locale === "th" ? "ตั้งโต๊ะและผู้เล่น" : "Configure Roster & Stakes"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed [text-wrap:pretty]">
              {locale === "th"
                ? "เลือกจำนวนผู้เล่น 2–8 คน กำหนดระบบการคิดแต้ม (แต้มสากลหรือนับลูก) และระบุอัตราเงินต่อแต้ม/ลูก"
                : "Add players with custom colors, pick point or ball count rules, and set money stakes."}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold">
                2
              </span>
              <span className="text-xs font-bold text-foreground font-heading">
                {locale === "th" ? "นับแต้มแบบเรียลไทม์" : "Scoring via Tactical Ballpad"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed [text-wrap:pretty]">
              {locale === "th"
                ? "กดแต้มตามจริงผ่านปุ่มลูกสนุ๊กเกอร์ 7 สี พร้อมปุ่มฟาวล์ หลุดสนุ๊กเกอร์ และปุ่ม Undo ย้อนหลังได้ทันที"
                : "Tap the 7-color ergonomic pad, log fouls and misses, with unlimited full undo protection."}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                3
              </span>
              <span className="text-xs font-bold text-foreground font-heading">
                {locale === "th" ? "ตัดยอดหนี้ & สแกนจ่าย" : "Minimal Settlement & QR"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed [text-wrap:pretty]">
              {locale === "th"
                ? "เมื่อจบเกม ระบบจะคำนวณหักลบหนี้รอบวงอัตโนมัติ รวบยอดให้โอนน้อยที่สุด พร้อมสร้าง PromptPay QR"
                : "Instant cycle calculation produces minimal bank transfer instructions with PromptPay QR."}
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER / SYSTEM STATUS BANNER ───────────────────────────────── */}
      <footer className="rounded-2xl border border-border/80 bg-surface/50 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono">MESNOOKER PRO · SECURED &amp; VERIFIED</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <Link href="/settings?tab=rules" className="hover:text-primary transition-colors">
            {locale === "th" ? "กติกาการเล่น" : "Custom Rules"}
          </Link>
          <span>·</span>
          <Link href="/settings?tab=account" className="hover:text-primary transition-colors">
            {locale === "th" ? "บัญชีผู้ใช้" : "Account & Auth"}
          </Link>
          <span>·</span>
          <Link href="/stats" className="hover:text-primary transition-colors">
            {locale === "th" ? "สถิติผู้เล่น" : "Player Stats"}
          </Link>
        </div>
      </footer>
    </div>
  );
}