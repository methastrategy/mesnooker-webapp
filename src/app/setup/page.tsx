"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { NewSession } from "@/components/game/NewSession";

/** Dedicated setup screen: choose game mode, rate, red-count and players.
 *  Kept OFF the live-match surface so starting a game and playing it are two
 *  distinct pages. On start, writes the session then jumps to /match. */
export default function SetupPage() {
  const router = useRouter();
  const startSession = useGameStore((s) => s.startSession);
  const session = useGameStore((s) => s.session);

  // Already playing → no need to reconfigure, go to the table.
  // Navigation happens in an effect AFTER hydration: calling router.replace
  // during render (a render-phase side effect) wedges the App Router on a
  // full-page load of /setup, leaving the Loading screen forever.
  useEffect(() => {
    if (session && session.status === "live") {
      router.replace("/match");
    }
  }, [session, router]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-bold">New game</h1>
      <NewSession
        onStart={(o) => {
          startSession(o);
          router.push("/match");
        }}
      />
      <p className="text-[11px] text-muted-foreground">
        Setup is separate from the live table — a game only begins when you tap “Start session”.
      </p>
    </div>
  );
}