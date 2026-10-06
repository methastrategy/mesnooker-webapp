"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Play,
  Trophy,
  Timer,
  Zap,
  Coins,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Crosshair,
  Sliders,
  ChevronRight,
  Smartphone,
} from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const session = useGameStore((s) => s.session);
  const frames = useGameStore((s) => s.frames);
  const history = useGameStore((s) => s.history);
  const locale = useGameStore((s) => s.locale);
  const moneyRate = useGameStore((s) => s.moneyRate);
  const moneyPer = useGameStore((s) => s.moneyPer);

  const isLive = session && session.status === "live" && frames.length > 0;
  const currentFrame = frames[frames.length - 1];

  const QUICK_ACTIONS = [
    {
      titleTh: "เริ่มเกมใหม่",
      titleEn: "Start New Game",
      tagTh: "ตั้งค่าโต๊ะ & ผู้เล่น",
      tagEn: "Setup Wizard",
      descTh: "กำหนดผู้เล่น 2–8 คน เลือกระบบแต้มสากลหรือนับลูกไทย ตั้งอัตราเดิมพันและจำนวนลูกแดง",
      descEn: "Configure 2–8 players, select points or ball count mode, and set stakes per unit.",
      href: "/setup",
      icon: Play,
      badgeTh: "เริ่มเล่น",
      badgeEn: "Start",
      color: "from-amber-500/20 to-amber-600/5",
      border: "hover:border-amber-500/50",
      accent: "text-amber-400",
      iconBg: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    },
    {
      titleTh: "กระดานคะแนนสด",
      titleEn: "Live Scoreboard",
      tagTh: "ระบบนับแต้มสรีรศาสตร์",
      tagEn: "Precision Ballpad",
      descTh: "Ballpad 7 สีแถวเดียวไม่บังจอ บันทึกทุกช็อต สถิติเบรกสูงสุด พร้อมระบบ Undo ย้อนหลังไม่จำกัด",
      descEn: "Single-row 7-ball keypad, live break counters, highest break badges, and full undo replay.",
      href: "/match",
      icon: Timer,
      badgeTh: "กระดานสด",
      badgeEn: "Live Board",
      color: "from-primary/20 to-primary/5",
      border: "hover:border-primary/50",
      accent: "text-primary",
      iconBg: "bg-primary/15 border-primary/30 text-primary",
    },
    {
      titleTh: "ซิมูเลเตอร์ & โค้ช",
      titleEn: "AI Coach & Simulator",
      tagTh: "แก้สนุ๊กเกอร์ 1–3 ชิ่ง",
      tagEn: "Tactical Solver",
      descTh: "คำนวณวิถีหนีสนุ๊กเกอร์ด้วยเรขาคณิต 2D จุดสัมผัสหัวคิว (Cue Tip) และมุมกระทบชิ่งแม่นยำ",
      descEn: "2D raycasting escape solver, cue tip contact picker, 1–3 cushion bank shot calculator.",
      href: "/solve",
      icon: Zap,
      badgeTh: "วิเคราะห์",
      badgeEn: "Analyze",
      color: "from-sky-500/20 to-sky-600/5",
      border: "hover:border-sky-500/50",
      accent: "text-sky-400",
      iconBg: "bg-sky-500/15 border-sky-500/30 text-sky-400",
    },
    {
      titleTh: "ระบบเคลียร์บัญชี",
      titleEn: "Financial Settlement",
      tagTh: "หักลบหนี้รอบวงขั้นต่ำ",
      tagEn: "Minimal Transfers",
      descTh: "คำนวณยอดได้เสียรอบวง (Cycle) อัตโนมัติ รวบหนี้เหลือโอนน้อยที่สุด พร้อมสร้าง PromptPay QR",
      descEn: "Automated Thai snooker money ledger, minimal-transfer net settlement, PromptPay QR generator.",
      href: "/settlement",
      icon: Coins,
      badgeTh: "คิดเงิน",
      badgeEn: "Settlement",
      color: "from-amber-500/20 to-amber-600/5",
      border: "hover:border-amber-500/50",
      accent: "text-amber-400",
      iconBg: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    },
  ];

  const FEATURES = [
    {
      titleTh: "นับคะแนน 2 รูปแบบสมบูรณ์",
      titleEn: "Dual Game Modes",
      descTh: "รองรับทั้งกติกาแต้มสากล (Point Scoring) และกติกานับลูกแบบไทย (Ball Count) สลับได้ทันที",
      descEn: "Full support for international points rules and traditional Thai ball count matches.",
      icon: Trophy,
    },
    {
      titleTh: "อัลกอริทึมเคลียร์เงินขั้นต่ำ",
      titleEn: "Minimal Debt Transfers",
      descTh: "คำนวณยอดสุทธิและรวบรายการโอนเงินระหว่างผู้เล่นให้เหลือจำนวนครั้งน้อยที่สุด ลดความวุ่นวาย",
      descEn: "Greedy graph simplification algorithm reduces group debts into the fewest possible bank transfers.",
      icon: Coins,
    },
    {
      titleTh: "เรขาคณิตฟิสิกส์ 2D",
      titleEn: "Realtime 2D Physics",
      descTh: "ระบบจำลองการวิ่งของลูก การชนกระทบชิ่ง และการคำนวณ Ghost Ball สำหรับฝึกซ้อมและวิเคราะห์",
      descEn: "Precision collision detection, cushion reflections, and ghost ball targeting simulation.",
      icon: Crosshair,
    },
    {
      titleTh: "ทำงานออฟไลน์ 100%",
      titleEn: "Offline-First Reliability",
      descTh: "ข้อมูลทั้งหมดถูกบันทึกในอุปกรณ์ทันที ใช้งานได้แม้ไม่มีสัญญาณอินเทอร์เน็ตบนโต๊ะสนุ๊กเกอร์",
      descEn: "Instant local persistence means zero lost frames, even with poor venue connectivity.",
      icon: Smartphone,
    },
    {
      titleTh: "ความปลอดภัยระดับสูง",
      titleEn: "Enterprise Security",
      descTh: "ระบบยืนยันตัวตนเข้ารหัส scrypt, Rate Limiting ป้องกัน Brute-force และ HTTP Security Headers",
      descEn: "Scrypt password hashing, adaptive per-IP brute-force throttling, and strict HTTP security headers.",
      icon: ShieldCheck,
    },
    {
      titleTh: "สถิติและประวัติย้อนหลัง",
      titleEn: "Lifetime Ledger & Stats",
      descTh: "เก็บบันทึกประวัติทุกแมตช์ ทุกเฟรม สถิติเบรกสูงสุด และยอดเงินสะสมของผู้เล่นแต่ละคน",
      descEn: "Comprehensive match history, highest break records, and individual player financial stats.",
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-10 sm:space-y-14 animate-in fade-in duration-300 pb-12">
      {/* ── LIVE SESSION ALERT BANNER ───────────────────────────────────── */}
      {isLive && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-primary/50 bg-surface/90 p-4 sm:p-5 shadow-xl backdrop-blur-xl"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/40 shadow-xs">
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                </span>
                <Timer size={22} className="text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                    {locale === "th" ? "กำลังแข่งขันสด" : "Live Match in Progress"}
                  </span>
                  <span className="rounded-full bg-primary/20 border border-primary/30 px-2 py-0.2 text-[10px] font-mono font-bold text-primary">
                    Frame {frames.length}
                  </span>
                </div>
                <div className="text-sm font-semibold text-foreground mt-0.5">
                  {session?.players.map((p) => p.nickname).join(" vs ") || "Active Match"}
                  {currentFrame && (
                    <span className="text-xs font-mono text-muted-foreground ml-2">
                      ({locale === "th" ? "โหมด" : "Mode"}: {session?.mode === "balls" ? "Ball Count" : "Points"})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Link
              href="/match"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/60 bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-all hover:bg-primary-hover active:scale-95 shrink-0"
            >
              <span>{locale === "th" ? "กลับสู่เกมทันที" : "Resume Match"}</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </motion.div>
      )}

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card/90 via-surface/80 to-background p-6 sm:p-10 md:p-12 shadow-2xl backdrop-blur-2xl text-center">
        {/* Ambient Warm Golden Lounge Glow Background */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-[90%] max-w-3xl rounded-full bg-gradient-to-b from-amber-500/15 via-primary/10 to-transparent blur-3xl" />
        
        <div className="relative z-10 max-w-3xl mx-auto space-y-4 sm:space-y-6">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-400 shadow-xs">
            <Sparkles size={14} className="text-amber-400" />
            <span className="font-mono tracking-wide">MESNOOKER 2026 PRO EDITION</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
            {locale === "th" ? (
              <>
                ยกระดับการแข่งขันสนุ๊กเกอร์ <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-primary to-amber-300">
                  และบัญชีเดิมพันระดับมืออาชีพ
                </span>
              </>
            ) : (
              <>
                Precision Snooker Scoring &amp; <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-primary to-amber-300">
                  Financial Settlement Engine
                </span>
              </>
            )}
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {locale === "th"
              ? "ระบบจัดการโต๊ะสนุ๊กเกอร์ที่สมบูรณ์แบบที่สุด รองรับทั้งการนับแต้มสากลและนับลูกไทย คำนวณตัดหนี้รอบวงอัตโนมัติ พร้อมระบบฟิสิกส์ 2D วิเคราะห์วิถีหนีสนุ๊กเกอร์ 1–3 ชิ่ง"
              : "The definitive companion for competitive Thai snooker. Realtime ballpad scoring, automated minimal-transfer money settlement, and 2D physics cushion escape solver."}
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/60 border-t-white/25 bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary-hover active:scale-95"
            >
              <Play size={16} className="fill-current" />
              <span>{locale === "th" ? "เริ่มเกมใหม่" : "Start New Game"}</span>
            </Link>

            <Link
              href="/match"
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-surface/90 px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-card active:scale-95 shadow-xs"
            >
              <Timer size={16} className="text-primary" />
              <span>{locale === "th" ? "กระดานคะแนนสด" : "Open Scoreboard"}</span>
            </Link>

            <Link
              href="/settlement"
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-surface/90 px-6 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all hover:border-amber-500/40 hover:bg-card active:scale-95 shadow-xs"
            >
              <Coins size={16} className="text-amber-400" />
              <span>{locale === "th" ? "สรุปยอดเงิน" : "Settlement"}</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8 border-t border-border/60 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>{locale === "th" ? "เกมที่บันทึกแล้ว" : "Archived Games"}:</span>
              <span className="font-mono font-bold text-foreground">{history.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>{locale === "th" ? "อัตราเดิมพันตั้งต้น" : "Default Rate"}:</span>
              <span className="font-mono font-bold text-amber-400">
                ฿{moneyRate}/{moneyPer}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-primary" />
              <span>{locale === "th" ? "ระบบเข้ารหัสปลอดภัย" : "Hardened & Protected"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE 4 QUICK-ACTIONS GRID ────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Crosshair size={20} className="text-primary" />
              <span>{locale === "th" ? "เมนูการใช้งานหลัก" : "Core Command Center"}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {locale === "th"
                ? "เลือกฟังก์ชันที่ต้องการเพื่อเริ่มต้นใช้งานได้ทันที"
                : "Direct access to live match scoring, solvers, and settlement ledger"}
            </p>
          </div>

          <Link
            href="/settings"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <Sliders size={14} />
            <span>{locale === "th" ? "ตั้งค่าระบบ" : "Preferences"}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {QUICK_ACTIONS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.href}
                className={cn(
                  "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card/85 p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl",
                  item.border
                )}
              >
                <div className={cn("pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-gradient-to-br opacity-50 blur-2xl transition-opacity group-hover:opacity-80", item.color)} />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border shadow-xs transition-transform group-hover:scale-105", item.iconBg)}>
                      <Icon size={20} />
                    </div>
                    <span className="rounded-full bg-surface border border-border px-2.5 py-0.5 text-[10px] font-mono font-bold text-muted-foreground group-hover:text-foreground">
                      {locale === "th" ? item.badgeTh : item.badgeEn}
                    </span>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      {locale === "th" ? item.tagTh : item.tagEn}
                    </div>
                    <h3 className="text-base font-bold text-foreground mt-0.5 group-hover:text-primary transition-colors">
                      {locale === "th" ? item.titleTh : item.titleEn}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">
                      {locale === "th" ? item.descTh : item.descEn}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                  <span>{locale === "th" ? "เปิดใช้งาน" : "Open Workspace"}</span>
                  <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 3-STEP GAME WORKFLOW STRIP ──────────────────────────────────── */}
      <section className="rounded-2xl border border-border/80 bg-surface/70 p-5 sm:p-7 space-y-4">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">
            {locale === "th" ? "ขั้นตอนการทำงานง่ายๆ" : "Streamlined Snooker Workflow"}
          </span>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground mt-1">
            {locale === "th" ? "เล่นสนุ๊กเกอร์และเคลียร์เงินใน 3 ขั้นตอน" : "From Break-Off to Bank Transfer"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          <div className="rounded-xl border border-border/70 bg-card/70 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary font-mono text-xs font-bold">
                1
              </span>
              <span className="text-xs font-bold text-foreground">
                {locale === "th" ? "ตั้งโต๊ะและผู้เล่น" : "Configure Roster & Stakes"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === "th"
                ? "เลือกจำนวนผู้เล่น 2–8 คน กำหนดระบบการคิดแต้ม (แต้มสากลหรือนับลูก) และระบุอัตราเงินต่อแต้ม/ลูก"
                : "Add players with custom colors, pick point or ball count rules, and set money stakes."}
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card/70 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold">
                2
              </span>
              <span className="text-xs font-bold text-foreground">
                {locale === "th" ? "นับแต้มแบบเรียลไทม์" : "Scoring via Tactical Ballpad"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === "th"
                ? "กดแต้มตามจริงผ่านปุ่มลูกสนุ๊กเกอร์ 7 สี พร้อมปุ่มฟาวล์ หลุดสนุ๊กเกอร์ และปุ่ม Undo ย้อนหลังได้ทันที"
                : "Tap the 7-color ergonomic pad, log fouls and misses, with unlimited full undo protection."}
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card/70 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                3
              </span>
              <span className="text-xs font-bold text-foreground">
                {locale === "th" ? "ตัดยอดหนี้ & สแกนจ่าย" : "Minimal Settlement & QR"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === "th"
                ? "เมื่อจบเกม ระบบจะคำนวณหักลบหนี้รอบวงอัตโนมัติ รวบยอดให้โอนน้อยที่สุด พร้อมสร้าง PromptPay QR"
                : "Instant cycle calculation produces minimal bank transfer instructions with PromptPay QR."}
            </p>
          </div>
        </div>
      </section>

      {/* ── KEY FEATURES SHOWCASE ───────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles size={20} className="text-amber-400" />
            <span>{locale === "th" ? "ฟีเจอร์ระดับพรีเมียม" : "Engine Capabilities"}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "th"
              ? "ออกแบบเพื่อความแม่นยำ รวดเร็ว และเป็นธรรมสำหรับผู้เล่นทุกคน"
              : "Engineered for zero-latency competition and bulletproof money reconciliation"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-3.5 rounded-2xl border border-border/80 bg-card/60 p-4.5 transition-all hover:bg-card/90 hover:border-primary/30"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface border border-border text-primary shadow-xs">
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">
                    {locale === "th" ? f.titleTh : f.titleEn}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    {locale === "th" ? f.descTh : f.descEn}
                  </p>
                </div>
              </div>
            );
          })}
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