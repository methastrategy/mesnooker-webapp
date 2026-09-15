"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { NewSession } from "@/components/game/NewSession";
import { LiveMatch } from "@/components/game/LiveMatch";
import { FrameCompleteSummary } from "@/components/game/FrameSummary";
import type { ArchivedGame } from "@/types";

export default function MatchPage() {
  const session = useGameStore((s) => s.session);
  const frames = useGameStore((s) => s.frames);
  const startSession = useGameStore((s) => s.startSession);
  const [justFinished, setJustFinished] = useState<ArchivedGame | null>(null);

  if (!session || frames.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        {justFinished ? (
          <FrameCompleteSummary
            game={justFinished}
            onNewGame={() => setJustFinished(null)}
          />
        ) : null}
        <h1 className="text-3xl font-bold">Live match</h1>
        <NewSession onStart={(o) => startSession(o)} />
      </div>
    );
  }

  return <LiveMatch onFinish={(a) => setJustFinished(a)} />;
}