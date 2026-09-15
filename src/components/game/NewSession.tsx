"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { BALL_ORDER } from "@/lib/rules";
import { AVATAR_PRESETS } from "@/lib/avatar";
import { AvatarPicker } from "@/components/game/AvatarPicker";
import type { GameMode, MoneyRateUnit, Player } from "@/types";
import { uid } from "@/lib/utils";

/** New session setup: players (default 2), avatars, mode, money rate, red-count */
export function NewSession({
  onStart,
  initialPlayers,
}: {
  onStart: (o: {
    players: Player[];
    mode: GameMode;
    moneyRate: number;
    moneyPer: MoneyRateUnit;
    redCount: number;
    tableFee?: number;
  }) => void;
  initialPlayers?: Player[];
}) {
  const [mode, setMode] = useState<GameMode>("points");
  const [moneyRate, setMoneyRate] = useState(1);
  const [names, setNames] = useState<string[]>(
    initialPlayers?.map((p) => p.nickname) ?? ["Metha", "Player 2"]
  );
  const [avatars, setAvatars] = useState<string[]>(
    initialPlayers?.map((p) => p.avatar ?? "") ?? [AVATAR_PRESETS[0], AVATAR_PRESETS[1]]
  );
  const [count, setCount] = useState(2);
  const [redCount, setRedCount] = useState(15);

  const shown = names.slice(0, count);
  const validPlayers = shown.filter((n) => n.trim());

  // Money unit follows the game mode automatically: point count => per point,
  // ball count => per ball. No separate toggle needed.
  const moneyPer: MoneyRateUnit = mode === "points" ? "point" : "ball";

  function bump(d: number) {
    const nc = Math.max(2, Math.min(8, count + d));
    setCount(nc);
    // grow names & avatars to new count
    const nextNames = [...names];
    const nextAvatars = [...avatars];
    while (nextNames.length < nc) {
      nextNames.push("");
      nextAvatars.push(AVATAR_PRESETS[nextAvatars.length % AVATAR_PRESETS.length]);
    }
    setNames(nextNames.slice(0, nc));
    setAvatars(nextAvatars.slice(0, nc));
  }

  function setAvatar(i: number, v: string) {
    const next = [...avatars];
    next[i] = v;
    setAvatars(next);
  }

  function start() {
    const players: Player[] = shown.map((n, i) => ({
      id: uid(),
      nickname: n.trim() || `P${i + 1}`,
      color: BALL_ORDER[i % BALL_ORDER.length],
      avatar: avatars[i] || AVATAR_PRESETS[i % AVATAR_PRESETS.length],
    }));
    if (players.length < 2) return;
    onStart({ players, mode, moneyRate, moneyPer, redCount });
  }

  return (
    <div className="glass flex flex-col gap-5 p-5">
      <div>
        <h2 className="text-lg font-bold">New session</h2>
        <p className="text-sm text-muted-foreground">Choose your rule, rate and players.</p>
      </div>

      {/* Mode */}
      <div>
        <div className="mb-2 flex justify-between">
          <span className="text-sm font-medium">Game mode</span>
          <Badge>({mode === "points" ? "point count" : "ball count"})</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant={mode === "points" ? "default" : "glass"} onClick={() => setMode("points")}>
            Point count
          </Button>
          <Button variant={mode === "balls" ? "default" : "glass"} onClick={() => setMode("balls")}>
            Ball count
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {mode === "points" ? "red=1, yellow=2 … black=7 · foul −4" : "every colour 1 (brown/black 2) · foul −2"}
        </p>
      </div>

      {/* Red count */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Red balls</span>
          <Badge>{redCount} reds</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[6, 10, 15].map((n) => (
            <Button key={n} variant={redCount === n ? "default" : "glass"} size="sm" onClick={() => setRedCount(n)}>
              {n}
            </Button>
          ))}
        </div>
      </div>

      {/* Money */}
      <div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Rate</span>
          <Button variant="glass" size="icon" onClick={() => setMoneyRate(Math.max(0.5, moneyRate - 0.5))} aria-label="Decrease rate">
            <Minus size={18} />
          </Button>
          <div className="h-12 min-w-24 rounded-2xl border border-gold/40 bg-white/5 px-4 text-center text-xl font-bold text-gold tabular-nums">
            ฿{moneyRate.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
            <span className="text-[10px] text-gold/70">/{moneyPer}</span>
          </div>
          <Button variant="gold" size="icon" onClick={() => setMoneyRate(moneyRate + 0.5)} aria-label="Increase rate">
            <Plus size={18} />
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Money is {moneyPer === "point" ? "per point scored" : "per ball potted"}, matching your game mode.
        </p>
      </div>

      {/* Players */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Players</span>
          <div className="flex items-center gap-1 rounded-full bg-white/5 px-2">
            <Button variant="glass" size="iconSm" onClick={() => bump(-1)} aria-label="Remove player">
              <Minus size={15} />
            </Button>
            <span className="min-w-7 text-center font-bold tabular-nums">{count}</span>
            <Button variant="glass" size="iconSm" onClick={() => bump(1)} aria-label="Add player">
              <Plus size={15} />
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {shown.map((n, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
              <AvatarPicker value={avatars[i] ?? ""} onChange={(v) => setAvatar(i, v)} />
              <input
                value={n}
                onChange={(e) => {
                  const next = [...names];
                  next[i] = e.target.value;
                  setNames(next);
                }}
                placeholder={`Player ${i + 1}`}
                className="h-11 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/60"
              />
              {i > 0 && (
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={() => {
                    const next = [...names];
                    next[i] = "";
                    setNames(next);
                  }}
                  aria-label="Clear name"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Tap a player's avatar to pick, upload or shuffle. Min 2 players.
        </p>
      </div>

      <Button onClick={start} disabled={validPlayers.length < 2} size="lg" className="w-full">
        Start session <span className="text-sm opacity-70">{validPlayers.length} players</span>
      </Button>
    </div>
  );
}