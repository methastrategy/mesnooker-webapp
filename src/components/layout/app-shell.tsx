"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { TopDockNav, BottomNav } from "./nav";
import { useGameStore } from "@/store/gameStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useGameStore((s) => s.theme);
  const pathname = usePathname();

  // Apply the active theme to the root <html data-theme="…"> so the Tailwind
  // `@theme` utility tokens (bg-*, text-*, border-*, ring-*) re-theme app-wide.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const isAuthPage = pathname === "/login";
  const isMatchPage = pathname === "/match";
  const session = useGameStore((s) => s.session);
  const frames = useGameStore((s) => s.frames);
  const isLiveMatch = isMatchPage && Boolean(session && session.status === "live" && frames.length > 0);

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
    <div
      className={
        isLiveMatch
          ? "relative flex h-[100dvh] max-h-[100dvh] flex-col bg-background text-foreground antialiased selection:bg-primary/20 overflow-hidden"
          : "relative flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/20"
      }
    >
      <TopDockNav />
      <main
        className={
          isLiveMatch
            ? "relative z-10 w-full min-w-0 flex-1 px-2 sm:px-4 pt-1 sm:pt-2 pb-1 sm:pb-2 flex flex-col overflow-hidden"
            : "relative z-10 w-full min-w-0 flex-1 px-3 sm:px-6 pt-3 sm:pt-4 pb-24 md:pb-12"
        }
      >
        <div
          className={
            isLiveMatch
              ? "mx-auto w-full max-w-5xl md:max-w-6xl h-full flex flex-col overflow-hidden"
              : "mx-auto w-full max-w-5xl md:max-w-6xl"
          }
        >
          {children}
        </div>
      </main>
      {!isLiveMatch && <BottomNav />}
    </div>
  );
}