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
              "radial-gradient(60% 40% at 85% 0%, color-mix(in srgb, var(--primary) 13%, #000 87%), transparent 60%), radial-gradient(50% 35% at 0% 100%, color-mix(in srgb, var(--gold) 9%, #000 91%), transparent 60%)",
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
            "radial-gradient(60% 40% at 85% 0%, color-mix(in srgb, var(--primary) 13%, #000 87%), transparent 60%), radial-gradient(50% 35% at 0% 100%, color-mix(in srgb, var(--gold) 9%, #000 91%), transparent 60%)",
        }}
      />
      <button
        type="button"
        onClick={() => store.openSettings()}
        aria-label="Settings"
        aria-haspopup="dialog"
        className="fixed right-4 top-4 z-30 rounded-full bg-black/50 p-2.5 text-muted-foreground backdrop-blur-md hover:bg-white/10 hover:text-foreground"
      >
        <SettingsIcon size={18} />
      </button>
      <SettingsSheet />
      <Sidebar />
      <main className="relative z-10 w-full min-w-0 flex-1 px-4 pb-36 pt-16 md:px-8 md:pb-12 md:pt-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}