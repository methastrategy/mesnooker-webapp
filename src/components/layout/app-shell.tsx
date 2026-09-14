"use client";

import { useEffect } from "react";
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
      <Sidebar />
      <main className="relative z-10 w-full min-w-0 flex-1 px-4 pb-28 pt-safe md:px-8 md:pb-12 md:pt-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}