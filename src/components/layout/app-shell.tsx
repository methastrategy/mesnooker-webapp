"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Settings as SettingsIcon } from "lucide-react";
import { Sidebar, BottomNav } from "./nav";
import { SettingsSheet } from "./settings-sheet";
import { useGameStore } from "@/store/gameStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const store = useGameStore();
  const theme = store.theme;
  const pathname = usePathname();

  // Apply the active theme to the root <html data-theme="…"> so the Tailwind
  // `@theme` utility tokens (bg-*, text-*, border-*, ring-*) re-theme app-wide.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // A sheet left open (e.g. Settings) must never follow the user to another
  // page: its full-screen backdrop blocks every tap on the new screen and the
  // nav z-order makes it look like "the buttons are dead". Close on route change.
  useEffect(() => {
    store.closeSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const isAuthPage = pathname === "/login";

  if (isAuthPage) {
    return (
      <div className="relative flex min-h-screen bg-background text-foreground">
        <main className="relative z-10 w-full min-w-0 flex-1 px-4 py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen bg-background text-foreground">
      <div className="fixed right-4 top-4 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={() => store.setLocale(store.locale === "th" ? "en" : "th")}
          aria-label="Switch Language TH/EN"
          className="flex items-center gap-1 rounded-[8px] border border-border border-t-white/15 bg-card px-2.5 py-1.5 text-[11px] font-mono font-medium transition-all hover:bg-surface active:translate-y-[2px] active:brightness-90 cursor-pointer"
        >
          <span className={store.locale === "th" ? "text-primary font-bold" : "text-muted-foreground"}>TH</span>
          <span className="text-border text-[10px]">/</span>
          <span className={store.locale === "en" ? "text-primary font-bold" : "text-muted-foreground"}>EN</span>
        </button>
        <button
          type="button"
          onClick={() => store.openSettings()}
          aria-label="Settings"
          aria-haspopup="dialog"
          className="rounded-[8px] border border-border border-t-white/15 bg-card p-2 text-muted-foreground transition-all hover:bg-surface hover:text-foreground active:translate-y-[2px] active:brightness-90 cursor-pointer"
        >
          <SettingsIcon size={17} />
        </button>
      </div>
      <SettingsSheet />
      <Sidebar />
      <main className="relative z-10 w-full min-w-0 flex-1 px-3.5 sm:px-4 pb-36 pt-16 md:px-8 md:pb-12 md:pt-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}