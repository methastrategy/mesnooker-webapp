"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Settings as SettingsIcon } from "lucide-react";
import { Sidebar, BottomNav } from "./nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
    return (
    <div className="relative flex min-h-screen bg-[#050505] text-foreground">
      {/* ambient emerald glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(60% 40% at 85% 0%, rgba(22,199,132,0.08), transparent 60%), radial-gradient(50% 35% at 0% 100%, rgba(245,158,11,0.05), transparent 60%)",
        }}
      />
      {/* small gear top-right (keeps Settings reachable on mobile without bottom tab) */}
      <Link
        href="/settings"
        aria-label="Settings"
        className="fixed right-4 top-4 z-30 rounded-full bg-black/50 p-2.5 text-muted-foreground backdrop-blur-md hover:bg-white/10 hover:text-foreground"
      >
        <SettingsIcon size={18} />
      </Link>
      <Sidebar />
      <main className="relative z-10 w-full min-w-0 flex-1 px-4 pb-28 pt-16 md:px-8 md:pb-12 md:pt-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}