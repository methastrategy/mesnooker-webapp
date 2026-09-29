"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Timer,
  BarChart3,
  Settings,
  Zap,
  Globe,
  User,
  Sliders,
  SlidersHorizontal,
  Database,
  Crosshair,
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

/**
 * Top Floating Island Command Dock — Pro Command HUD Architecture
 * Replaces fixed left sidebar with a panoramic floating dock centered at top.
 */
export function TopDockNav() {
  const pathname = usePathname();
  const locale = useGameStore((s) => s.locale);
  const setLocale = useGameStore((s) => s.setLocale);

  const NAV_ITEMS = [
    { href: "/match", label: t("nav.match", locale), icon: Timer },
    { href: "/solve", label: "Simulator", icon: Zap },
    { href: "/stats", label: t("nav.stats", locale), icon: BarChart3 },
  ];

  const isSettings = pathname.startsWith("/settings");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6">
        
        {/* Brand Zone: Squircle Icon + Name + HUD Badge */}
        <Link href="/match" className="flex items-center gap-2 group select-none shrink-0">
          <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/30 group-hover:border-primary/60 transition-colors shadow-xs">
            <Crosshair size={18} className="text-primary transition-transform duration-200 group-hover:rotate-45" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black tracking-tight text-foreground font-mono">
                MESNOOKER
              </span>
              <span className="hidden xs:inline-flex rounded-full bg-primary/20 border border-primary/35 px-1.5 py-0.2 text-[9px] font-mono font-bold text-primary tracking-widest uppercase">
                PRO
              </span>
            </div>
          </div>
        </Link>

        {/* Center Zone: Segmented Pill Navigation */}
        <nav className="flex items-center gap-1 rounded-full border border-border/70 bg-surface/70 p-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/match"
                ? pathname === "/match" || pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href);

            return (
              <Link key={item.href} href={item.href} className="relative">
                <span
                  className={cn(
                    "relative z-10 flex items-center gap-1.5 rounded-full px-2.5 sm:px-3.5 py-1 text-xs font-semibold transition-colors duration-150",
                    active
                      ? "text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon size={15} className={cn(active ? "text-primary" : "text-muted-foreground")} />
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
                {active && (
                  <motion.span
                    layoutId="topdock-active-pill"
                    className="absolute inset-0 z-0 rounded-full bg-primary/15 border border-primary/30 shadow-xs"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Zone: Language + Settings Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Language Toggle Pill */}
          <button
            type="button"
            onClick={() => setLocale(locale === "th" ? "en" : "th")}
            aria-label="Switch Language TH/EN"
            className="flex items-center gap-1 rounded-full border border-border bg-surface/80 px-2.5 py-1 text-[11px] font-mono font-semibold transition-all hover:border-primary/40 hover:bg-surface active:scale-95 cursor-pointer shadow-xs"
          >
            <Globe size={13} className="text-primary" />
            <span className={locale === "th" ? "text-primary font-bold" : "text-muted-foreground"}>TH</span>
            <span className="text-border text-[9px]">/</span>
            <span className={locale === "en" ? "text-primary font-bold" : "text-muted-foreground"}>EN</span>
          </button>

          {/* Settings Trigger Link */}
          <Link
            href="/settings"
            aria-label="Settings"
            className={cn(
              "flex h-8 w-8 sm:h-8 sm:w-auto sm:px-3 items-center justify-center gap-1.5 rounded-full border text-xs font-semibold transition-all shadow-xs active:scale-95",
              isSettings
                ? "border-primary/60 bg-primary/15 text-primary font-bold ring-1 ring-primary/30"
                : "border-border bg-surface/80 text-muted-foreground hover:text-foreground hover:border-primary/40"
            )}
          >
            <Settings size={14} className={isSettings ? "text-primary" : "text-muted-foreground"} />
            <span className="hidden sm:inline">{t("nav.settings", locale)}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Settings Horizontal Category Pill Ribbon */
export function SettingsCategoryTabs({ locale }: { locale: "th" | "en" }) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "account";

  return (
    <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-1.5 rounded-2xl border border-border/80 bg-card/85 shadow-md">
      {SETTINGS_CATEGORIES.map((cat) => {
        const active = currentTab === cat.id;
        const Icon = cat.icon;
        return (
          <Link
            key={cat.id}
            href={`/settings?tab=${cat.id}`}
            className={cn(
              "relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors select-none",
              active
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
            )}
          >
            {active && (
              <motion.span
                layoutId="settings-tab-active-pill"
                className="absolute inset-0 -z-0 rounded-xl bg-primary/15 border border-primary/30 shadow-xs"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}
            <Icon size={15} className={cn("relative z-10", active ? "text-primary" : "text-muted-foreground")} />
            <span className="relative z-10">{locale === "th" ? cat.labelTh : cat.labelEn}</span>
          </Link>
        );
      })}
    </div>
  );
}

/** Legacy alias for compatibility */
export function Sidebar() {
  return null;
}

/** Mobile bottom navigation bar with balanced touch targets and localized labels */
export function BottomNav() {
  const pathname = usePathname();
  const locale = useGameStore((s) => s.locale);

  const NAV_BOTTOM = [
    { href: "/match", label: t("nav.match", locale), icon: Timer },
    { href: "/solve", label: "Simulator", icon: Zap },
    { href: "/stats", label: t("nav.stats", locale), icon: BarChart3 },
    { href: "/settings", label: t("nav.settings", locale), icon: Settings },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-surface/90 pb-safe backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
        {NAV_BOTTOM.map((item) => {
          const active =
            item.href === "/match"
              ? pathname === "/match" || pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-0.5 py-1"
            >
              <motion.span
                animate={{ scale: active ? 1.06 : 1, y: active ? -2 : 0 }}
                className={cn(
                  "rounded-full p-2 transition-colors",
                  active ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground"
                )}
              >
                <item.icon size={18} />
              </motion.span>
              <span
                className={cn(
                  "text-[10px] tracking-tight leading-tight",
                  active ? "text-primary font-bold" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}