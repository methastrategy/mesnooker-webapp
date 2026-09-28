"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Timer,
  BarChart3,
  Settings,
  Wallet,
  Zap,
  Globe,
  ArrowLeft,
  User,
  Sliders,
  SlidersHorizontal,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/gameStore";
import { t } from "@/lib/i18n";

export interface SettingsCategory {
  id: "account" | "rules" | "general" | "data";
  labelTh: string;
  labelEn: string;
  icon: typeof User;
  descriptionTh: string;
  descriptionEn: string;
}

export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    id: "account",
    labelTh: "ข้อมูลบัญชี",
    labelEn: "Account & Profile",
    icon: User,
    descriptionTh: "สถานะการใช้งานและระบบยืนยันตัวตน",
    descriptionEn: "Identity and session authentication",
  },
  {
    id: "rules",
    labelTh: "แก้ไขกฏการเล่น",
    labelEn: "Game Rules",
    icon: Sliders,
    descriptionTh: "ปรับแต่งคะแนนแต่ละลูกและแต้มปรับฟาวล์",
    descriptionEn: "Custom ball values and penalty points",
  },
  {
    id: "general",
    labelTh: "การตั้งค่าทั่วไป",
    labelEn: "Preferences",
    icon: SlidersHorizontal,
    descriptionTh: "ภาษา ธีมสี เสียง และการสั่น",
    descriptionEn: "Language, theme, sound FX and haptics",
  },
  {
    id: "data",
    labelTh: "ข้อมูลและสำรอง",
    labelEn: "Data & Storage",
    icon: Database,
    descriptionTh: "ประวัติการแข่ง ส่งออกสำรอง และรีเซ็ต",
    descriptionEn: "History, JSON backup, and factory reset",
  },
];

function SettingsNavItems({ locale }: { locale: "th" | "en" }) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "account";

  return (
    <div className="flex flex-col gap-1">
      {SETTINGS_CATEGORIES.map((cat) => {
        const active = currentTab === cat.id;
        const Icon = cat.icon;
        return (
          <Link key={cat.id} href={`/settings?tab=${cat.id}`}>
            <span
              className={cn(
                "relative flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="settings-sidebar-active"
                  className="absolute inset-0 -z-0 rounded-[8px] bg-primary/10 border border-primary/25"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon size={17} className={cn("relative z-10", active ? "text-primary" : "text-muted-foreground")} />
              <div className="relative z-10 flex flex-col min-w-0 flex-1">
                <span className="truncate leading-tight">
                  {locale === "th" ? cat.labelTh : cat.labelEn}
                </span>
              </div>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/** Desktop left sidebar — Raycast Precision Minimal Pro */
export function Sidebar() {
  const pathname = usePathname();
  const locale = useGameStore((s) => s.locale);
  const setLocale = useGameStore((s) => s.setLocale);
  const isSettings = pathname.startsWith("/settings");

  const PRIMARY_NAV = [
    { href: "/match", label: t("nav.match", locale), icon: Timer },
    { href: "/stats", label: t("nav.stats", locale), icon: BarChart3 },
  ];

  const TOOLS_NAV = [
    { href: "/solve", label: "Snooker Simulator", icon: Zap },
  ];

  if (isSettings) {
    return (
      <aside className="sticky top-0 hidden h-screen w-64 flex-col gap-1.5 border-r border-border bg-card p-4 md:flex shrink-0">
        {/* Back Link */}
        <Link
          href="/match"
          className="group mb-2 flex items-center gap-2 rounded-[8px] border border-border bg-surface/70 px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-surface hover:text-foreground active:translate-y-[1px]"
        >
          <ArrowLeft size={14} className="text-primary transition-transform group-hover:-translate-x-0.5" />
          <span>{locale === "th" ? "← กลับสู่กระดานแข่ง" : "← Back to Match"}</span>
        </Link>

        {/* Settings Header */}
        <div className="mb-3 px-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-primary/15 text-primary border border-primary/25">
              <Settings size={15} />
            </span>
            <div>
              <div className="text-sm font-bold tracking-tight text-foreground">
                {locale === "th" ? "การตั้งค่าระบบ" : "Preferences"}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-primary">
                Raycast Precision
              </div>
            </div>
          </div>
        </div>

        <div className="my-1 border-t border-border" />
        <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
          {locale === "th" ? "หมวดหมู่" : "Categories"}
        </div>

        {/* Dynamic Category List */}
        <Suspense fallback={<div className="p-3 text-xs text-muted-foreground">Loading...</div>}>
          <SettingsNavItems locale={locale} />
        </Suspense>

        {/* Bottom Footer */}
        <div className="mt-auto flex flex-col gap-3 px-2 pt-4 border-t border-border">
          <button
            onClick={() => setLocale(locale === "th" ? "en" : "th")}
            className="flex items-center justify-between rounded-[8px] border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Globe size={14} className="text-primary" />
              <span>Language</span>
            </span>
            <span className="rounded-[4px] bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              {locale.toUpperCase()}
            </span>
          </button>
          <div className="text-[10px] font-mono text-muted-foreground">
            Raycast UI · v5
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-60 flex-col gap-1.5 border-r border-border bg-card p-4 md:flex shrink-0">
      {/* Brand Header */}
      <div className="mb-4 flex items-center gap-2.5 px-2 pt-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-primary/15 text-primary border border-primary/30">
          <Wallet size={16} />
        </span>
        <div>
          <div className="text-sm font-bold tracking-tight text-foreground">MESNOOKER</div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Raycast Precision</div>
        </div>
      </div>

      {/* Primary Section */}
      <div className="flex flex-col gap-1">
        {PRIMARY_NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "relative flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "text-primary font-semibold" : "text-muted-foreground hover:bg-surface hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 -z-0 rounded-[8px] bg-primary/10 border border-primary/25"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <item.icon size={18} className="relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </span>
            </Link>
          );
        })}
      </div>

      {/* Hairline Divider & Tools Section */}
      <div className="my-2 border-t border-border" />
      <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
        {t("nav.tools", locale)}
      </div>

      <div className="flex flex-col gap-1">
        {TOOLS_NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "relative flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "text-primary font-semibold" : "text-muted-foreground hover:bg-surface hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 -z-0 rounded-[8px] bg-primary/10 border border-primary/25"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <item.icon size={18} className="relative z-10 text-primary" />
                <span className="relative z-10">{item.label}</span>
              </span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Footer: Dedicated Settings button at bottom-left */}
      <div className="mt-auto flex flex-col gap-2.5 px-1 pt-4 border-t border-border">
        <Link
          href="/settings"
          className={cn(
            "flex items-center justify-between rounded-[8px] border border-border bg-surface/70 px-3 py-2.5 text-xs font-semibold transition-all hover:border-primary/40 hover:bg-surface hover:text-foreground",
            isSettings ? "border-primary/50 bg-primary/10 text-primary font-bold" : "text-muted-foreground"
          )}
        >
          <span className="flex items-center gap-2">
            <Settings size={16} className={isSettings ? "text-primary" : "text-muted-foreground"} />
            <span>{locale === "th" ? "ตั้งค่าระบบ" : "Settings"}</span>
          </span>
          <span className="text-[10px] font-mono text-muted-foreground/80">
            {locale === "th" ? "ทั่วไป/กฏ" : "Prefs"}
          </span>
        </Link>

        <button
          onClick={() => setLocale(locale === "th" ? "en" : "th")}
          className="flex items-center justify-between rounded-[8px] border border-border bg-surface/50 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Globe size={14} className="text-primary" />
            <span>Language</span>
          </span>
          <span className="rounded-[4px] bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
            {locale.toUpperCase()}
          </span>
        </button>
        <div className="text-[10px] font-mono text-muted-foreground px-1">
          Raycast UI · v5
        </div>
      </div>
    </aside>
  );
}

/** Mobile bottom navigation bar with balanced touch targets and localized labels */
export function BottomNav() {
  const pathname = usePathname();
  const locale = useGameStore((s) => s.locale);

  const NAV_BOTTOM = [
    { href: "/match", label: t("nav.match", locale), icon: Timer },
    { href: "/stats", label: t("nav.stats", locale), icon: BarChart3 },
    { href: "/solve", label: "Simulator", icon: Zap },
    { href: "/settings", label: t("nav.settings", locale), icon: Settings },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-safe backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
        {NAV_BOTTOM.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-0.5 py-1"
            >
              <motion.span
                animate={{ scale: active ? 1.08 : 1, y: active ? -2 : 0 }}
                className={cn(
                  "rounded-full p-2 transition-colors",
                  active ? "bg-primary/20 text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon size={19} />
              </motion.span>
              <span className={cn("text-[10px] tracking-tight leading-tight", active ? "text-primary font-bold" : "text-muted-foreground")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}