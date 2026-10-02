"use client";

import * as React from "react";
import { Target, Plus } from "lucide-react";
import { useCoachStore } from "@/store/coachStore";
import { useGameStore } from "@/store/gameStore";
import { BALL_COLORS, type BallColor } from "@/lib/geometry";
import { t } from "@/lib/i18n";

const TRAY: BallColor[] = ["red", "yellow", "green", "brown", "blue", "pink"];

export function BallTrayToolbar() {
  const balls = useCoachStore((s) => s.balls);
  const addBall = useCoachStore((s) => s.addBall);
  const locale = useGameStore((s) => s.locale);

  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-4 border border-white/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Target ball indicator (Permanently Black) */}
        <div className="flex items-center gap-2">
          <Target size={16} className="text-gold" />
          <span className="text-xs font-semibold text-muted-foreground">
            {t("solve.target", locale)}:
          </span>
          <span
            className="inline-block h-5 w-5 rounded-full border border-black/40 shadow-sm"
            style={{ background: BALL_COLORS.black }}
          />
          <span className="text-sm font-bold text-foreground">
            {t("solve.target.black", locale)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            {t("solve.ballsOnTable", locale)}:{" "}
            <strong className="text-foreground">{balls.length}</strong> ·{" "}
            {t("solve.dragHint", locale)}
          </span>
        </div>
      </div>

      {/* Add Ball Tray (Blockers Only) */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Plus size={13} /> {t("solve.addBlocker", locale)}
        </span>
        <div className="flex items-center gap-1">
          {TRAY.map((c) => (
            <button
              key={c}
              onClick={() => addBall(c)}
              aria-label={`Add ${c}`}
              title={`Add ${c} ball`}
              className="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center p-1 rounded-full cursor-pointer hover:bg-surface transition-colors"
            >
              <span
                className="h-6 w-6 rounded-full border border-black/40 shadow-xs transition-transform hover:scale-110 active:scale-95 block"
                style={{
                  background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.7), ${
                    BALL_COLORS[c]
                  } 65%)`,
                }}
              />
            </button>
          ))}
        </div>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {t("solve.blockerHint", locale)}
        </span>
      </div>
    </div>
  );
}
