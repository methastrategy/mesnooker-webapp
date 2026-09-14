"use client";

import { useGameStore } from "@/store/gameStore";
import { NewSession } from "@/components/game/NewSession";
import { LiveMatch } from "@/components/game/LiveMatch";

export default function MatchPage() {
  const session = useGameStore((s) => s.session);
  const startSession = useGameStore((s) => s.startSession);
  const frames = useGameStore((s) => s.frames);

  if (!session || frames.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-bold">Live match</h1>
        <NewSession
          onStart={(o) => startSession(o)}
        />
      </div>
    );
  }

  return <LiveMatch />;
}