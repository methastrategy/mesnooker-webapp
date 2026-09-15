"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { NewSession } from "@/components/game/NewSession";
import { LiveMatch } from "@/components/game/LiveMatch";
import { FrameCompleteSummary } from "@/components/game/FrameSummary";
import { FramePauseSummary } from "@/components/game/FramePauseSummary";
import type { ArchivedGame } from "@/types";

export default function MatchPage() {
  const session = useGameStore((s) => s.session);
  const frames = useGameStore((s) => s.frames);
  const startSession = useGameStore((s) => s.startSession);
  // When a frame is ended (End frame) but the session continues, show the
  // pause summary. Set by LiveMatch via onPause.
  const [paused, setPaused] = useState(false);
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

  // Between frames: last frame is done, session continues.
  const lastFrame = frames[frames.length - 1];
  if (paused && lastFrame?.endedAt) {
    return (
      <FramePauseSummary
        onFinish={(a) => {
          setPaused(false);
          setJustFinished(a);
        }}
      />
    );
  }

  return (
    <LiveMatch
      onPause={() => setPaused(true)}
      onFinish={(a) => setJustFinished(a)}
    />
  );
}