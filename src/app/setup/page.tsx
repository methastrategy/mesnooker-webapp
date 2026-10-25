"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { NewSession } from "@/components/game/NewSession";

/**
 * Dedicated setup screen: choose game mode, rate, red-count and players.
 * Kept OFF the live-match surface so starting a game and playing it are two
 * distinct pages. On start, writes the session then jumps to /match.
 */
export default function SetupPage() {
  const router = useRouter();
  const startSession = useGameStore((s) => s.startSession);
  const session = useGameStore((s) => s.session);

  useEffect(() => {
    if (session && session.status === "live") {
      router.replace("/match");
    }
  }, [session, router]);

  return (
    <div className="mx-auto w-full max-w-2xl py-1 sm:py-3">
      <NewSession
        onStart={(o) => {
          startSession(o);
          router.push("/match");
        }}
      />
    </div>
  );
}
