"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Sliders,
  SlidersHorizontal,
  Database,
  ShieldCheck,
  Smartphone,
  LogOut,
  LogIn,
  RotateCcw,
  Download,
  Trash2,
  Volume2,
  Vibrate,
  Globe,
  Palette,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { BALL_ORDER, BALL_HEX, BALL_NAME, DEFAULT_CUSTOM_RULES } from "@/lib/rules";
import { fetchMe, apiSignOut, type MeResponse } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import type { GameMode } from "@/types";

const THEMES = [
  { id: "mono", name: "Raycast Dark", swatch: ["#cc785c", "#f59e0b", "#0c0a09"] },
  { id: "emerald", name: "Emerald Noir", swatch: ["#16c784", "#f59e0b", "#050505"] },
  { id: "ember", name: "Ember", swatch: ["#f97316", "#f59e0b", "#100a06"] },
  { id: "forest", name: "Forest", swatch: ["#22c55e", "#eab308", "#05080a"] },
  { id: "midnight", name: "Midnight", swatch: ["#4f8cff", "#f5c518", "#050814"] },
  { id: "violet", name: "Violet", swatch: ["#a855f7", "#f59e0b", "#09060d"] },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      role="switch"
      aria-checked={on}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors cursor-pointer",
        on ? "bg-primary border-primary/50" : "bg-surface border-border"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all",
          on ? "left-5.5 bg-primary-foreground" : "left-0.5 bg-foreground"
        )}
      />
    </button>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as "account" | "rules" | "general" | "data") || "account";

  const locale = useGameStore((s) => s.locale);
  const setLocale = useGameStore((s) => s.setLocale);
  const sound = useGameStore((s) => s.sound);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const haptics = useGameStore((s) => s.haptics);
  const toggleHaptics = useGameStore((s) => s.toggleHaptics);
  const theme = useGameStore((s) => s.theme);
  const setTheme = useGameStore((s) => s.setTheme);
  const moneyRate = useGameStore((s) => s.moneyRate);
  const setMoneyRate = useGameStore((s) => s.setMoneyRate);
  const moneyPer = useGameStore((s) => s.moneyPer);
  const setMoneyPer = useGameStore((s) => s.setMoneyPer);

  // Custom Rules
  const customRules = useGameStore((s) => s.customRules) || DEFAULT_CUSTOM_RULES;
  const setBallPointValue = useGameStore((s) => s.setBallPointValue);
  const setFoulPenalty = useGameStore((s) => s.setFoulPenalty);
  const setMissPenalty = useGameStore((s) => s.setMissPenalty);
  const resetCustomRules = useGameStore((s) => s.resetCustomRules);

  // History & Storage
  const history = useGameStore((s) => s.history);
  const frames = useGameStore((s) => s.frames);
  const session = useGameStore((s) => s.session);
  const clearHistory = useGameStore((s) => s.clearHistory);

  // Auth info
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [ruleMode, setRuleMode] = useState<GameMode>("points");
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchMe()
      .then((data) => setMe(data))
      .finally(() => setLoadingAuth(false));
  }, []);

  const triggerNotice = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 2400);
  };

  const handleSignOut = async () => {
    await apiSignOut();
    router.push("/login");
  };

  const handleExportJSON = () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: "5.0",
        session,
        history,
        customRules,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mesnooker-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      triggerNotice(locale === "th" ? "ส่งออกข้อมูลสำรองเรียบร้อย" : "Backup exported successfully");
    } catch {
      alert("Failed to export backup.");
    }
  };

  const handleClearHistory = () => {
    if (
      confirm(
        locale === "th"
          ? "ต้องการล้างประวัติการแข่งขันทั้งหมดหรือไม่? (ข้อมูลกติกาและการตั้งค่าจะยังคงอยู่)"
          : "Are you sure you want to clear all match history? (Rules and preferences will be kept)"
      )
    ) {
      clearHistory();
      triggerNotice(locale === "th" ? "ล้างประวัติการแข่งขันแล้ว" : "Match history cleared");
    }
  };

  const handleFactoryReset = () => {
    if (
      confirm(
        locale === "th"
          ? "คำเตือน: รีเซ็ตข้อมูลทั้งหมดเป็นค่าเริ่มต้นโรงงาน? ข้อมูลผู้เล่น ประวัติ และการตั้งค่าทั้งหมดจะถูกลบ!"
          : "WARNING: Factory reset will clear all local data, frames, custom rules, and history!"
      )
    ) {
      try {
        localStorage.clear();
      } catch {}
      window.location.href = "/";
    }
  };

  const tabs: Array<{ id: "account" | "rules" | "general" | "data"; labelTh: string; labelEn: string; icon: typeof User }> = [
    { id: "account", labelTh: "ข้อมูลบัญชี", labelEn: "Account", icon: User },
    { id: "rules", labelTh: "แก้ไขกฏการเล่น", labelEn: "Game Rules", icon: Sliders },
    { id: "general", labelTh: "การตั้งค่าทั่วไป", labelEn: "Preferences", icon: SlidersHorizontal },
    { id: "data", labelTh: "ข้อมูลและสำรอง", labelEn: "Data & Storage", icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Top Category Tabs (Sleek Horizontal Squircle Ribbon) */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-1.5 rounded-2xl border border-border/80 bg-card/85 shadow-md backdrop-blur-md">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={`/settings?tab=${tab.id}`}
              className={cn(
                "relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none",
                active
                  ? "text-primary font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
              )}
            >
              {active && (
                <motion.span
                  layoutId="settings-tab-active-pill"
                  className="absolute inset-0 -z-0 rounded-xl bg-primary/15 border border-primary/30"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <Icon size={15} className={cn("relative z-10", active ? "text-primary" : "text-muted-foreground")} />
              <span className="relative z-10">{locale === "th" ? tab.labelTh : tab.labelEn}</span>
            </Link>
          );
        })}
      </div>

      {/* Floating Save/Notice Toast */}
      <AnimatePresence>
        {savedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-primary/40 bg-surface/95 px-5 py-2.5 text-xs font-semibold text-primary shadow-2xl backdrop-blur-xl"
          >
            <Check size={14} className="text-primary" />
            <span>{savedNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 1: ข้อมูลบัญชี (Account & Identity) */}
      {activeTab === "account" && (
        <section className="space-y-5 animate-in fade-in duration-200">
          <div className="border-b border-border pb-3">
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheck className="text-primary" size={20} />
              <span>{locale === "th" ? "ข้อมูลบัญชีผู้ใช้งาน" : "Account & Identity"}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {locale === "th"
                ? "ตรวจสอบสถานะการเข้าใช้งาน รูปแบบเซสชัน และข้อมูลอุปกรณ์"
                : "Manage authentication, session status, and cloud connection"}
            </p>
          </div>

          {loadingAuth ? (
            <div className="p-8 text-center text-xs text-muted-foreground font-mono">
              Loading identity status…
            </div>
          ) : me ? (
            /* Authenticated Cloud Account Card */
            <div className="rounded-[10px] border border-border bg-card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary border border-primary/30">
                    <User size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{me.username || me.email}</span>
                      <span className="rounded-[4px] bg-primary/20 px-2 py-0.5 text-[10px] font-mono font-bold text-primary">
                        Cloud Account
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      UID: {me.id}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 rounded-[8px] border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>{locale === "th" ? "ออกจากระบบ" : "Sign Out"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                <div className="rounded-[8px] bg-surface p-3">
                  <div className="text-[11px] text-muted-foreground">
                    {locale === "th" ? "รูปแบบการเข้าใช้" : "Access Provider"}
                  </div>
                  <div className="text-xs font-semibold text-foreground mt-0.5">
                    Secure Cookie (HTTP-Only Session)
                  </div>
                </div>
                <div className="rounded-[8px] bg-surface p-3">
                  <div className="text-[11px] text-muted-foreground">
                    {locale === "th" ? "การซิงค์ข้อมูล" : "Cloud Sync"}
                  </div>
                  <div className="text-xs font-semibold text-primary mt-0.5 flex items-center gap-1">
                    <Check size={13} />
                    <span>{locale === "th" ? "เชื่อมต่อฐานข้อมูลเรียบร้อย" : "Active & Synchronized"}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Guest / Local Storage Session Card */
            <div className="rounded-[10px] border border-border bg-card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-muted-foreground border border-border">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {locale === "th" ? "โหมดผู้ใช้ทั่วไป (Guest Session)" : "Local Guest Session"}
                      </span>
                      <span className="rounded-[4px] bg-surface px-2 py-0.5 text-[10px] font-mono text-muted-foreground border border-border">
                        Local Only
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-xl">
                      {locale === "th"
                        ? "คุณกำลังใช้งานในโหมดเครื่องนี้โดยตรง ข้อมูลการนับแต้ม สถิติ และกติกาที่ตั้งค่าจะถูกบันทึกไว้อย่างปลอดภัยในหน่วยความจำของเบราว์เซอร์นี้ (Local Storage) หากต้องการเก็บข้อมูลถาวรข้ามอุปกรณ์ สามารถเข้าสู่ระบบด้วยบัญชีคลาวด์ได้"
                        : "You are operating in offline-first mode. Match sessions and custom rules persist locally on this device. Sign in to sync across devices."}
                    </p>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 rounded-[8px] border border-primary/40 bg-primary/15 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/25 transition-all shrink-0"
                >
                  <LogIn size={15} />
                  <span>{locale === "th" ? "เข้าสู่ระบบ / บัญชีคลาวด์" : "Sign In to Cloud"}</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border/60">
                <div className="rounded-[8px] bg-surface p-2.5">
                  <div className="text-[10px] font-mono text-muted-foreground">STORAGE ENGINE</div>
                  <div className="text-xs font-semibold text-foreground mt-0.5">LocalStorage & State</div>
                </div>
                <div className="rounded-[8px] bg-surface p-2.5">
                  <div className="text-[10px] font-mono text-muted-foreground">ACTIVE SESSIONS</div>
                  <div className="text-xs font-semibold text-foreground mt-0.5">
                    {session ? `1 Live Match (${frames.length} frames)` : "Ready for match"}
                  </div>
                </div>
                <div className="rounded-[8px] bg-surface p-2.5">
                  <div className="text-[10px] font-mono text-muted-foreground">SAVED MATCHES</div>
                  <div className="text-xs font-semibold text-foreground mt-0.5">{history.length} games recorded</div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* SECTION 2: แก้ไขกฏการเล่น (Custom Game Rules) */}
      {activeTab === "rules" && (
        <section className="space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <Sliders className="text-primary" size={20} />
                <span>{locale === "th" ? "แก้ไขกฏและการนับคะแนน" : "Game Rules Customizer"}</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {locale === "th"
                  ? "กำหนดคะแนนของลูกแต่ละสี และค่าปรับฟาวล์/หลุดสนุ๊กเกอร์สำหรับแต่ละโหมด"
                  : "Customize point scoring per ball and foul/miss penalty values"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                resetCustomRules(ruleMode);
                triggerNotice(
                  locale === "th"
                    ? `คืนค่ามาตรฐานโหมด ${ruleMode === "points" ? "คะแนนสากล" : "นับลูก"} เรียบร้อย`
                    : `Reset ${ruleMode} mode rules to official default`
                );
              }}
              className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw size={13} />
              <span>{locale === "th" ? "คืนค่ามาตรฐานโหมดนี้" : "Reset This Mode"}</span>
            </button>
          </div>

          {/* Mode Selector Segment */}
          <div className="flex rounded-[10px] border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setRuleMode("points")}
              className={cn(
                "flex-1 py-2 rounded-[8px] text-xs font-bold transition-all cursor-pointer text-center",
                ruleMode === "points"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {locale === "th" ? "โหมดนับคะแนนสากล (Point Count)" : "Point Count Mode"}
            </button>
            <button
              type="button"
              onClick={() => setRuleMode("balls")}
              className={cn(
                "flex-1 py-2 rounded-[8px] text-xs font-bold transition-all cursor-pointer text-center",
                ruleMode === "balls"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {locale === "th" ? "โหมดนับลูก (Ball Count)" : "Ball Count Mode"}
            </button>
          </div>

          {/* Per-Ball Point Customizer Grid */}
          <div className="rounded-[10px] border border-border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {locale === "th" ? "คะแนนเมื่อแทงลงหลุม (แต้มต่อลูก)" : "Point Values Per Ball"}
              </span>
              <span className="text-[11px] font-mono text-primary">
                {ruleMode === "points" ? "Standard Rules" : "Thai Custom"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {BALL_ORDER.map((ball) => {
                const currentVal = customRules[ruleMode]?.balls?.[ball] ?? DEFAULT_CUSTOM_RULES[ruleMode].balls[ball];
                const defaultVal = DEFAULT_CUSTOM_RULES[ruleMode].balls[ball];
                return (
                  <div
                    key={ball}
                    className="flex items-center justify-between rounded-[8px] border border-border bg-surface p-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-4.5 w-4.5 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: BALL_HEX[ball] }}
                      />
                      <div>
                        <div className="text-xs font-semibold capitalize text-foreground">
                          {BALL_NAME[ball]}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {locale === "th" ? `มาตรฐาน: ${defaultVal}` : `Default: ${defaultVal}`}
                        </div>
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const next = Math.max(1, currentVal - 1);
                          setBallPointValue(ruleMode, ball, next);
                          triggerNotice(`${BALL_NAME[ball]}: ${next} pt`);
                        }}
                        className="h-7 w-7 rounded-[6px] border border-border bg-card text-muted-foreground hover:text-foreground flex items-center justify-center text-xs font-mono font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono text-sm font-bold text-primary">
                        {currentVal}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = Math.min(20, currentVal + 1);
                          setBallPointValue(ruleMode, ball, next);
                          triggerNotice(`${BALL_NAME[ball]}: ${next} pt`);
                        }}
                        className="h-7 w-7 rounded-[6px] border border-border bg-card text-muted-foreground hover:text-foreground flex items-center justify-center text-xs font-mono font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Penalty & Miss Deductions */}
          <div className="rounded-[10px] border border-border bg-card p-4 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {locale === "th" ? "แต้มหักค่าปรับ (Penalties)" : "Penalty Deductions"}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Foul Deduction */}
              <div className="rounded-[8px] border border-border bg-surface p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-foreground">
                    {locale === "th" ? "แต้มฟาวล์ (Foul Penalty)" : "Foul Penalty"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {locale === "th" ? "ค่ามาตรฐาน: -4 (คะแนน) / -2 (ลูก)" : "Standard deduction on foul"}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = customRules[ruleMode]?.foul ?? DEFAULT_CUSTOM_RULES[ruleMode].foul;
                      const next = cur - 1; // more negative
                      setFoulPenalty(ruleMode, next);
                      triggerNotice(`Foul: ${next}`);
                    }}
                    className="h-7 w-7 rounded-[6px] border border-border bg-card text-muted-foreground hover:text-foreground flex items-center justify-center text-xs font-mono font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-mono text-sm font-bold text-destructive">
                    {customRules[ruleMode]?.foul ?? DEFAULT_CUSTOM_RULES[ruleMode].foul}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = customRules[ruleMode]?.foul ?? DEFAULT_CUSTOM_RULES[ruleMode].foul;
                      const next = Math.min(-1, cur + 1); // closer to 0
                      setFoulPenalty(ruleMode, next);
                      triggerNotice(`Foul: ${next}`);
                    }}
                    className="h-7 w-7 rounded-[6px] border border-border bg-card text-muted-foreground hover:text-foreground flex items-center justify-center text-xs font-mono font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Snooker Miss Deduction */}
              <div className="rounded-[8px] border border-border bg-surface p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-foreground">
                    {locale === "th" ? "แต้มหลุดสนุ๊กเกอร์ (Miss Penalty)" : "Snooker Miss Penalty"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {locale === "th" ? "ค่ามาตรฐาน: -2 (คะแนน) / -1 (ลูก)" : "Standard deduction on miss"}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = customRules[ruleMode]?.miss ?? DEFAULT_CUSTOM_RULES[ruleMode].miss;
                      const next = cur - 1;
                      setMissPenalty(ruleMode, next);
                      triggerNotice(`Miss: ${next}`);
                    }}
                    className="h-7 w-7 rounded-[6px] border border-border bg-card text-muted-foreground hover:text-foreground flex items-center justify-center text-xs font-mono font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-mono text-sm font-bold text-gold">
                    {customRules[ruleMode]?.miss ?? DEFAULT_CUSTOM_RULES[ruleMode].miss}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = customRules[ruleMode]?.miss ?? DEFAULT_CUSTOM_RULES[ruleMode].miss;
                      const next = Math.min(-1, cur + 1);
                      setMissPenalty(ruleMode, next);
                      triggerNotice(`Miss: ${next}`);
                    }}
                    className="h-7 w-7 rounded-[6px] border border-border bg-card text-muted-foreground hover:text-foreground flex items-center justify-center text-xs font-mono font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: การตั้งค่าทั่วไป (Preferences) */}
      {activeTab === "general" && (
        <section className="space-y-5 animate-in fade-in duration-200">
          <div className="border-b border-border pb-3">
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <SlidersHorizontal className="text-primary" size={20} />
              <span>{locale === "th" ? "การตั้งค่าทั่วไป" : "General Preferences"}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {locale === "th"
                ? "ปรับแต่งภาษาแสดงผล ธีมสี เอฟเฟกต์เสียง และการสั่น"
                : "Configure visual theme, audio FX, and haptic feedback"}
            </p>
          </div>

          {/* Theme Selector */}
          <div className="rounded-[10px] border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Palette size={14} className="text-primary" />
              <span>{locale === "th" ? "ธีมสีหน้าจอ" : "Appearance Theme"}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {THEMES.map((th) => {
                const active = theme === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => {
                      setTheme(th.id);
                      triggerNotice(`Theme: ${th.name}`);
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-[8px] border p-2.5 text-xs font-semibold transition-all cursor-pointer",
                      active
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{th.name}</span>
                    <div className="flex items-center gap-1">
                      {th.swatch.map((c, i) => (
                        <span
                          key={i}
                          className="h-3 w-3 rounded-full border border-white/20"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hardware & Feedback Toggles */}
          <div className="rounded-[10px] border border-border bg-card p-4 divide-y divide-border/60">
            {/* Audio Toggle */}
            <div className="flex items-center justify-between py-3 first:pt-0">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-surface border border-border text-primary">
                  <Volume2 size={16} />
                </span>
                <div>
                  <div className="text-xs font-bold text-foreground">
                    {locale === "th" ? "เสียงเอฟเฟกต์ (Audio Effects)" : "Sound Effects"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {locale === "th" ? "เล่นเสียงเมื่อลงหลุมหรือทำฟาวล์" : "Play subtle audio cues on shots"}
                  </div>
                </div>
              </div>
              <Toggle on={sound} onChange={toggleSound} />
            </div>

            {/* Haptics Toggle */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-surface border border-border text-primary">
                  <Vibrate size={16} />
                </span>
                <div>
                  <div className="text-xs font-bold text-foreground">
                    {locale === "th" ? "การสั่นตอบสนอง (Haptic Vibration)" : "Haptic Feedback"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {locale === "th" ? "สั่นเบาๆ เมื่อกดปุ่มแอ็กชันบนมือถือ" : "Vibrate gently on button presses"}
                  </div>
                </div>
              </div>
              <Toggle on={haptics} onChange={toggleHaptics} />
            </div>

            {/* Language Selection */}
            <div className="flex items-center justify-between py-3 last:pb-0">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-surface border border-border text-primary">
                  <Globe size={16} />
                </span>
                <div>
                  <div className="text-xs font-bold text-foreground">
                    {locale === "th" ? "ภาษาแสดงผล (Language)" : "Display Language"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {locale === "th" ? "สลับระหว่างภาษาไทยและภาษาอังกฤษ" : "Switch between Thai and English"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLocale(locale === "th" ? "en" : "th")}
                className="rounded-[6px] border border-border bg-surface px-3 py-1.5 text-xs font-mono font-bold text-primary hover:bg-surface/80 cursor-pointer"
              >
                {locale.toUpperCase()}
              </button>
            </div>
          </div>

          {/* Default Money Stakes */}
          <div className="rounded-[10px] border border-border bg-card p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {locale === "th" ? "อัตราเดิมพันเริ่มต้น (Default Stakes)" : "Default Money Stakes"}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full flex items-center justify-between rounded-[8px] border border-border bg-surface p-3">
                <span className="text-xs font-medium text-foreground">
                  {locale === "th" ? "ราคาต่อหน่วย (฿)" : "Rate per unit (฿)"}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMoneyRate(Math.max(1, moneyRate - 1))}
                    className="h-7 w-7 rounded-[6px] border border-border bg-card text-muted-foreground hover:text-foreground flex items-center justify-center text-xs font-mono font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-mono text-sm font-bold text-foreground">
                    ฿{moneyRate}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMoneyRate(moneyRate + 1)}
                    className="h-7 w-7 rounded-[6px] border border-border bg-card text-muted-foreground hover:text-foreground flex items-center justify-center text-xs font-mono font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full flex items-center justify-between rounded-[8px] border border-border bg-surface p-3">
                <span className="text-xs font-medium text-foreground">
                  {locale === "th" ? "คิดเงินตาม" : "Calculated per"}
                </span>
                <div className="flex rounded-[6px] border border-border bg-card p-0.5">
                  <button
                    type="button"
                    onClick={() => setMoneyPer("point")}
                    className={cn(
                      "px-2.5 py-1 rounded-[4px] text-[11px] font-bold transition-colors cursor-pointer",
                      moneyPer === "point" ? "bg-primary/20 text-primary" : "text-muted-foreground"
                    )}
                  >
                    {locale === "th" ? "แต้ม (Point)" : "Point"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMoneyPer("ball")}
                    className={cn(
                      "px-2.5 py-1 rounded-[4px] text-[11px] font-bold transition-colors cursor-pointer",
                      moneyPer === "ball" ? "bg-primary/20 text-primary" : "text-muted-foreground"
                    )}
                  >
                    {locale === "th" ? "ลูก (Ball)" : "Ball"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 4: ข้อมูลและสำรอง (Data & Storage) */}
      {activeTab === "data" && (
        <section className="space-y-5 animate-in fade-in duration-200">
          <div className="border-b border-border pb-3">
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Database className="text-primary" size={20} />
              <span>{locale === "th" ? "ข้อมูลและสำรอง" : "Data & Storage"}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {locale === "th"
                ? "ส่งออกสำรองข้อมูล ล้างประวัติการแข่งขัน และรีเซ็ตระบบ"
                : "Export JSON backup, purge match history, or factory reset"}
            </p>
          </div>

          {/* Backup & Export Card */}
          <div className="rounded-[10px] border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-foreground">
                  {locale === "th" ? "ส่งออกข้อมูลสำรอง (JSON Backup)" : "Export Data Backup"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {locale === "th"
                    ? "ดาวน์โหลดไฟล์สำรองข้อมูลประวัติการแข่ง สถิติ และกติกาที่ปรับแต่งไว้"
                    : "Download complete JSON archive of all match data and rules"}
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 rounded-[8px] border border-primary/40 bg-primary/15 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/25 transition-all cursor-pointer shrink-0"
              >
                <Download size={14} />
                <span>{locale === "th" ? "ส่งออก JSON" : "Export JSON"}</span>
              </button>
            </div>
          </div>

          {/* History Purge Card */}
          <div className="rounded-[10px] border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-foreground">
                  {locale === "th" ? "ล้างประวัติการแข่งขัน (Clear Match History)" : "Clear Match History"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {locale === "th"
                    ? `ลบประวัติการแข่งที่จบแล้ว (${history.length} รายการ) โดยไม่กระทบกติกาหรือการตั้งค่า`
                    : `Purge archived matches (${history.length} games) without resetting rules`}
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearHistory}
                disabled={history.length === 0}
                className="flex items-center gap-1.5 rounded-[8px] border border-destructive/40 bg-destructive/10 px-3.5 py-2 text-xs font-bold text-destructive hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
              >
                <Trash2 size={14} />
                <span>{locale === "th" ? "ล้างประวัติ" : "Clear History"}</span>
              </button>
            </div>
          </div>

          {/* Danger Zone: Factory Reset */}
          <div className="rounded-[10px] border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-destructive">
                  <AlertTriangle size={16} />
                  <span>{locale === "th" ? "โซนอันตราย: รีเซ็ตข้อมูลทั้งหมด" : "Danger Zone: Factory Reset"}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                  {locale === "th"
                    ? "การรีเซ็ตจะล้างข้อมูลทุกอย่างออกจากเบราว์เซอร์ รวมถึงผู้เล่น สถิติ ประวัติ และกติกาที่ปรับแต่งไว้ทั้งหมด และคืนค่ากลับสู่สภาพเริ่มต้น"
                    : "Wipes all local data, players, active frames, and custom rule configurations. This cannot be undone."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleFactoryReset}
                className="flex items-center gap-1.5 rounded-[8px] border border-destructive bg-destructive px-3.5 py-2 text-xs font-bold text-white hover:brightness-110 transition-all cursor-pointer shrink-0"
              >
                <Trash2 size={14} />
                <span>{locale === "th" ? "รีเซ็ตระบบทั้งหมด" : "Factory Reset"}</span>
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="glass p-8 text-center text-xs text-muted-foreground font-mono">
          Loading preferences…
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}