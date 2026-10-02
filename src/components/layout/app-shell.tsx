"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { TopDockNav, BottomNav } from "./nav";
import { SettingsSheet } from "./settings-sheet";
import { useGameStore } from "@/store/gameStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useGameStore((s) => s.theme);
  const closeSettings = useGameStore((s) => s.closeSettings);
  const pathname = usePathname();

  // Apply the active theme to the root <html data-theme="…"> so the Tailwind
  // `@theme` utility tokens (bg-*, text-*, border-*, ring-*) re-theme app-wide.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // A sheet left open (e.g. Settings) must never follow the user to another
  // page: its full-screen backdrop blocks every tap on the new screen.
  useEffect(() => {
    closeSettings();
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
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      <SettingsSheet />
      <TopDockNav />
      <main className="relative z-10 w-full min-w-0 flex-1 px-3 sm:px-6 pt-3 sm:pt-4 pb-28 md:pb-12">
        <div className="mx-auto w-full max-w-5xl md:max-w-6xl">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}