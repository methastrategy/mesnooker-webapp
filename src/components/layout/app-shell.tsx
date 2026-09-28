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
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              "radial-gradient(60% 40% at 50% 0%, rgba(148, 163, 184, 0.04), transparent 60%)",
          }}
        />
        <main className="relative z-10 w-full min-w-0 flex-1 px-4 py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen bg-background text-foreground">
      {/* ambient glow — theme-aware via tokens */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 0%, rgba(148, 163, 184, 0.04), transparent 60%)",
        }}
      />
      <div className="fixed right-4 top-4 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={() => store.setLocale(store.locale === "th" ? "en" : "th")}
          aria-label="Switch Language TH/EN"
          className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#121317] px-2.5 py-1.5 text-[11px] font-mono font-medium backdrop-blur-md transition-all hover:bg-white/10 active:scale-95 shadow-sm"
        >
          <span className={store.locale === "th" ? "text-primary font-bold" : "text-zinc-500"}>TH</span>
          <span className="text-white/20 text-[10px]">/</span>
          <span className={store.locale === "en" ? "text-primary font-bold" : "text-zinc-500"}>EN</span>
        </button>
        <button
          type="button"
          onClick={() => store.openSettings()}
          aria-label="Settings"
          aria-haspopup="dialog"
          className="rounded-lg border border-white/10 bg-[#121317] p-2 text-zinc-400 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white active:scale-95 shadow-sm"
        >
          <SettingsIcon size={17} />
        </button>
      </div>
      <SettingsSheet />
      <Sidebar />
      <main className="relative z-10 w-full min-w-0 flex-1 px-4 pb-36 pt-16 md:px-8 md:pb-12 md:pt-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}