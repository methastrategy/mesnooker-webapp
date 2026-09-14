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
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/match", label: "Match", icon: Timer },
  { href: "/history", label: "History", icon: History },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];
/** Bottom nav (mobile) shows only the main tabs; Settings stays in the desktop sidebar. */
const NAV_BOTTOM = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/match", label: "Match", icon: Timer },
  { href: "/history", label: "History", icon: History },
  { href: "/stats", label: "Stats", icon: BarChart3 },
];

/** Desktop left sidebar */
export function Sidebar() {
  const pathname = usePathname();
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
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href}>
            <span
              className={cn(
                "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
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
      <div className="mt-auto px-2 text-[10px] text-muted-foreground">
        Emerald Noir v1.0
      </div>
    </aside>
  );
}

/** Mobile bottom navigation bar */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-black/70 pb-safe backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {NAV_BOTTOM.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-0.5 py-1"
            >
              <motion.span
                animate={{ scale: active ? 1.1 : 1, y: active ? -2 : 0 }}
                className={cn(
                  "rounded-full p-2",
                  active ? "bg-primary/20 text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon size={20} />
              </motion.span>
              <span className={cn("text-[9px]", active ? "text-primary font-semibold" : "text-muted-foreground")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}