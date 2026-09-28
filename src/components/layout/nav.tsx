"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Timer,
  BarChart3,
  Settings,
  Wallet,
  Zap,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/gameStore";
import { t } from "@/lib/i18n";

/** Desktop left sidebar — Raycast Precision Minimal Pro */
export function Sidebar() {
  const pathname = usePathname();
  const openSettings = useGameStore((s) => s.openSettings);
  const locale = useGameStore((s) => s.locale);
  const setLocale = useGameStore((s) => s.setLocale);

  const PRIMARY_NAV = [
    { href: "/match", label: t("nav.match", locale), icon: Timer },
    { href: "/stats", label: t("nav.stats", locale), icon: BarChart3 },
  ];

  const TOOLS_NAV = [
    { href: "/solve", label: "Snooker Simulator", icon: Zap },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-60 flex-col gap-1.5 border-r border-border bg-card p-4 md:flex">
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

        {/* Settings Action Button */}
        <button
          type="button"
          onClick={openSettings}
          aria-haspopup="dialog"
          className={cn(
            "relative flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-sm font-medium transition-colors cursor-pointer",
            "text-muted-foreground hover:bg-surface hover:text-foreground"
          )}
        >
          <Settings size={18} />
          <span className="flex-1">{t("nav.settings", locale)}</span>
        </button>
      </div>

      {/* Bottom Footer */}
      <div className="mt-auto flex flex-col gap-3 px-2 pt-4 border-t border-border">
        <button
          onClick={() => setLocale(locale === "th" ? "en" : "th")}
          className="flex items-center justify-between rounded-[8px] border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Globe size={14} className="text-gold" />
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

/** Mobile bottom navigation bar with balanced touch targets and localized labels */
export function BottomNav() {
  const pathname = usePathname();
  const locale = useGameStore((s) => s.locale);
  const openSettings = useGameStore((s) => s.openSettings);

  const NAV_BOTTOM = [
    { href: "/match", label: t("nav.match", locale), icon: Timer },
    { href: "/stats", label: t("nav.stats", locale), icon: BarChart3 },
    { href: "/solve", label: "Simulator", icon: Zap },
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

        {/* Mobile Settings Button */}
        <button
          type="button"
          onClick={openSettings}
          className="flex flex-1 flex-col items-center gap-0.5 py-1 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <span className="rounded-full p-2 transition-colors">
            <Settings size={19} />
          </span>
          <span className="text-[10px] tracking-tight leading-tight">
            {t("nav.settings", locale)}
          </span>
        </button>
      </div>
    </nav>
  );
}