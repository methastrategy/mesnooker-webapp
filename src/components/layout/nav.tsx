"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Timer,
  History,
  BarChart3,
  Settings,
  Wallet,
  Activity,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/gameStore";
import { t } from "@/lib/i18n";

/** Desktop left sidebar */
export function Sidebar() {
  const pathname = usePathname();
  const openSettings = useGameStore((s) => s.openSettings);
  const locale = useGameStore((s) => s.locale);
  const setLocale = useGameStore((s) => s.setLocale);

  const NAV = [
    { href: "/", label: t("nav.dashboard", locale), icon: Home },
    { href: "/match", label: t("nav.match", locale), icon: Timer },
    { href: "/solve", label: t("nav.solve.full", locale), icon: Activity },
    { href: "/history", label: t("nav.history", locale), icon: History },
    { href: "/stats", label: t("nav.stats", locale), icon: BarChart3 },
    { href: "/settings", label: t("nav.settings", locale), icon: Settings },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-60 flex-col gap-2 border-r border-white/5 bg-black/40 p-4 backdrop-blur-xl md:flex">
      <div className="mb-6 flex items-center gap-2 px-2 pt-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary">
          <Wallet size={18} />
        </span>
        <div>
          <div className="text-sm font-bold leading-tight">Snooker Money</div>
          <div className="text-[10px] uppercase tracking-widest text-gold">Tracker Pro</div>
        </div>
      </div>

      {NAV.map((item) => {
        if (item.href === "/settings") {
          return (
            <button
              key={item.href}
              type="button"
              onClick={openSettings}
              aria-haspopup="dialog"
              className={cn(
                "relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
            </button>
          );
        }
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href}>
            <span
              className={cn(
                "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "text-primary font-semibold" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 -z-0 rounded-2xl bg-primary/10"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <item.icon size={18} className="relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </span>
          </Link>
        );
      })}

      <div className="mt-auto flex flex-col gap-3 px-2 pt-4 border-t border-white/5">
        <button
          onClick={() => setLocale(locale === "th" ? "en" : "th")}
          className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all"
        >
          <span className="flex items-center gap-1.5">
            <Globe size={14} className="text-gold" />
            <span>Language</span>
          </span>
          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
            {locale.toUpperCase()}
          </span>
        </button>
        <div className="text-[10px] text-muted-foreground">
          Golden Lounge v4
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
    { href: "/", label: t("nav.dashboard", locale), icon: Home },
    { href: "/match", label: t("nav.match", locale), icon: Timer },
    { href: "/solve", label: t("nav.solve", locale), icon: Activity },
    { href: "/history", label: t("nav.history", locale), icon: History },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-black/75 pb-safe backdrop-blur-xl md:hidden">
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