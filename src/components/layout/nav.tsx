"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Timer,
  BarChart3,
  Settings,
  Globe,
  User,
  Sliders,
  SlidersHorizontal,
  Database,
  Crosshair,
  Coins,
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
    { href: "/settlement", label: t("nav.settlement", locale), icon: Coins },
    { href: "/stats", label: t("nav.stats", locale), icon: BarChart3 },
  ];

  const isSettings = pathname.startsWith("/settings");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-15 sm:h-16 max-w-6xl items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6">
        
        {/* Brand Zone: Squircle Icon + Name + HUD Badge */}
        <Link href="/" className="flex items-center gap-2.5 group select-none shrink-0" title="Mesnooker Home">
          <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/30 group-hover:border-primary/60 transition-colors shadow-xs">
            <Crosshair size={19} className="text-primary transition-transform duration-200 group-hover:rotate-45" />
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
        <nav
          aria-label="Main Navigation"
          className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-border/80 bg-surface/90 p-1 sm:p-1.5 shadow-md backdrop-blur-xl ring-1 ring-white/[0.04]"
        >
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/match"
                ? pathname === "/match"
                : pathname === item.href || pathname.startsWith(item.href);

            return (
              <Link key={item.href} href={item.href} className="relative group">
                <span
                  className={cn(
                    "relative z-10 flex items-center gap-2 rounded-full px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-semibold transition-all duration-150 select-none min-h-[42px] sm:min-h-[44px]",
                    active
                      ? "text-amber-300 font-bold"
                      : "text-foreground/75 hover:text-foreground hover:bg-white/[0.05]"
                  )}
                >
                  <item.icon
                    size={18}
                    className={cn(
                      "transition-colors shrink-0",
                      active ? "text-amber-400 stroke-[2.3]" : "text-muted-foreground group-hover:text-foreground stroke-[1.8]"
                    )}
                  />
                  <span className="hidden sm:inline tracking-tight">{item.label}</span>
                </span>
                {active && (
                  <motion.span
                    layoutId="topdock-active-pill"
                    className="absolute inset-0 z-0 rounded-full bg-gradient-to-b from-amber-500/25 via-amber-500/15 to-primary/20 border border-amber-400/40 shadow-[0_2px_12px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(255,255,255,0.12)]"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Zone: Language + Settings Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Toggle Pill */}
          <button
            type="button"
            onClick={() => setLocale(locale === "th" ? "en" : "th")}
            aria-label="Switch Language TH/EN"
            className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-border/80 bg-surface/85 px-3 sm:px-3.5 py-2 text-xs font-mono font-semibold transition-all hover:border-amber-400/40 hover:bg-surface active:scale-[0.97] cursor-pointer shadow-xs min-h-[42px] sm:min-h-[44px]"
          >
            <Globe size={15} className="text-amber-400" />
            <span className={locale === "th" ? "text-amber-300 font-bold" : "text-muted-foreground"}>TH</span>
            <span className="text-border text-[10px]">/</span>
            <span className={locale === "en" ? "text-amber-300 font-bold" : "text-muted-foreground"}>EN</span>
          </button>

          {/* Settings Trigger Link */}
          <Link
            href="/settings"
            aria-label="Settings"
            className={cn(
              "flex h-10 w-10 sm:h-11 sm:w-auto sm:px-4 items-center justify-center gap-2 rounded-full border text-xs sm:text-sm font-semibold transition-all shadow-xs active:scale-[0.97] min-h-[42px] sm:min-h-[44px]",
              isSettings
                ? "border-amber-400/50 bg-amber-500/20 text-amber-300 font-bold ring-1 ring-amber-400/30 shadow-[0_2px_8px_rgba(245,158,11,0.15)]"
                : "border-border/80 bg-surface/85 text-foreground/70 hover:text-foreground hover:border-amber-400/30"
            )}
          >
            <Settings size={16} className={isSettings ? "text-amber-400" : "text-muted-foreground"} />
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
    { href: "/settlement", label: t("nav.settlement", locale), icon: Coins },
    { href: "/stats", label: t("nav.stats", locale), icon: BarChart3 },
    { href: "/settings", label: t("nav.settings", locale), icon: Settings },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-surface/95 pb-safe backdrop-blur-xl md:hidden shadow-lg">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5 sm:py-2">
        {NAV_BOTTOM.map((item) => {
          const active =
            item.href === "/match"
              ? pathname === "/match"
              : pathname === item.href || pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-1 py-1 transition-all active:scale-95"
            >
              <motion.span
                animate={{ scale: active ? 1.08 : 1, y: active ? -2 : 0 }}
                className={cn(
                  "rounded-full px-3.5 py-1.5 transition-colors flex items-center justify-center min-h-[36px]",
                  active
                    ? "bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-[0_2px_8px_rgba(245,158,11,0.15)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon size={19} className={active ? "text-amber-400 stroke-[2.3]" : "stroke-[1.8]"} />
              </motion.span>
              <span
                className={cn(
                  "text-[11px] tracking-tight leading-tight transition-colors",
                  active ? "text-amber-300 font-bold" : "text-muted-foreground"
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