"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { LiveMatch } from "@/components/game/LiveMatch";
import { FrameCompleteSummary } from "@/components/game/FrameSummary";
import { FramePauseSummary } from "@/components/game/FramePauseSummary";
import { MatchLanding } from "@/components/game/MatchLanding";
import type { ArchivedGame } from "@/types";

export default function MatchPage() {
  const session = useGameStore((s) => s.session);
  const frames = useGameStore((s) => s.frames);
  const startSession = useGameStore((s) => s.startSession);

  // When a frame is ended (End frame) but the session continues, show the
  // pause summary. Set by LiveMatch via onPause.
  const [paused, setPaused] = useState(false);
  const [justFinished, setJustFinished] = useState<ArchivedGame | null>(null);

  // ─── No active session ───────────────────────────────────────────────────
  if (!session || frames.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        {/* If a game just finished, show its summary above the landing */}
        {justFinished ? (
          <FrameCompleteSummary
            game={justFinished}
            onNewGame={() => setJustFinished(null)}
          />
        ) : null}
        {/* Landing: New Game wizard + Recent sessions */}
        {!justFinished && (
          <MatchLanding
            onStart={(o) => {
              startSession(o);
              // Store will add a frame; the reactive read above will flip to LiveMatch
            }}
          />
        )}
      </div>
    );
  }

  // ─── Between frames: last frame done, session continues ──────────────────
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

  // ─── Live frame ─────────────────────────────────────────────────────────
  return (
    <LiveMatch
      onPause={() => setPaused(true)}
      onFinish={(a) => setJustFinished(a)}
    />
  );
}