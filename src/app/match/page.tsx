"use client";

import { useState } from "react";
import Link from "next/link";
import { useGameStore } from "@/store/gameStore";
import { LiveMatch } from "@/components/game/LiveMatch";
import { FrameCompleteSummary } from "@/components/game/FrameSummary";
import { FramePauseSummary } from "@/components/game/FramePauseSummary";
import type { ArchivedGame } from "@/types";

export default function MatchPage() {
  const session = useGameStore((s) => s.session);
  const frames = useGameStore((s) => s.frames);
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
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground">No game running yet.</p>
          <Link
            href="/setup"
            className="mt-4 inline-flex h-14 items-center justify-center gap-2 rounded-[18px] bg-primary px-8 text-center text-sm font-semibold text-primary-foreground"
          >
            Start a new game
          </Link>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Configure mode, rate, reds and players on the setup page first.
          </p>
        </div>
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