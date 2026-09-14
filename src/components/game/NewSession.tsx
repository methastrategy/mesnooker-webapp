"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { BALL_ORDER, BALL_HEX } from "@/lib/rules";
import type { GameMode, MoneyRateUnit, Player } from "@/types";
import { uid } from "@/lib/utils";

/** New session setup: players, mode, money rate, red-count */
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
  }) => void;
  initialPlayers?: Player[];
}) {
  const [mode, setMode] = useState<GameMode>("points");
  const [moneyPer, setMoneyPer] = useState<MoneyRateUnit>("point");
  const [moneyRate, setMoneyRate] = useState(1);
  const [names, setNames] = useState<string[]>(
    initialPlayers?.map((p) => p.nickname) ?? ["Metha", "", "", ""]
  );
  const [count, setCount] = useState(4);
  const [redCount, setRedCount] = useState(15);

  const shown = names.slice(0, count);
  const validPlayers = shown.filter((n) => n.trim());

  function bump(d: number) {
    const nc = Math.max(2, Math.min(8, count + d));
    setCount(nc);
    setNames((prev) => {
      const next = [...prev];
      while (next.length < nc) next.push("");
      return next.slice(0, nc);
    });
  }

  function start() {
    const players: Player[] = shown.map((n, i) => ({
      id: uid(),
      nickname: n.trim() || `P${i + 1}`,
      color: BALL_ORDER[i % BALL_ORDER.length],
    }));
    if (players.length < 2) return;
    onStart({ players, mode, moneyRate, moneyPer, redCount });
  }

  return (
    <div className="glass flex flex-col gap-5 p-5">
      <div>
        <h2 className="text-lg font-bold">New session</h2>
        <p className="text-sm text-muted-foreground">Set up tonight's table, mode and money rate.</p>
      </div>

      {/* Mode */}
      <div>
        <div className="mb-2 flex justify-between">
          <span className="text-sm font-medium">Game mode</span>
          <Badge>({mode === "points" ? "point count" : "ball count"})</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={mode === "points" ? "default" : "glass"}
            onClick={() => setMode("points")}
          >
            Point count
          </Button>
          <Button
            variant={mode === "balls" ? "default" : "glass"}
            onClick={() => setMode("balls")}
          >
            Ball count
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {mode === "points"
            ? "red=1, yellow=2 … black=7 · foul −4"
            : "every colour 1 (pink/black 2) · foul −2"}
        </p>
      </div>

      {/* Red count */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Red balls on table</span>
          <Badge>{redCount} reds</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[6, 10, 15].map((n) => (
            <Button
              key={n}
              variant={redCount === n ? "default" : "glass"}
              size="sm"
              onClick={() => setRedCount(n)}
            >
              {n} red
            </Button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Break sequence: red → colour → red … Reset on foul / miss. First pot of a break must be red.
        </p>
      </div>

      {/* Money */}
      <div>
        <div className="mb-2 flex flex-col gap-2">
          <span className="text-sm font-medium">Money unit</span>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={moneyPer === "point" ? "gold" : "glass"}
              size="sm"
              onClick={() => setMoneyPer("point")}
            >
              per point
            </Button>
            <Button
              variant={moneyPer === "ball" ? "gold" : "glass"}
              size="sm"
              onClick={() => setMoneyPer("ball")}
            >
              per ball
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm">Rate (฿/{moneyPer})</label>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={moneyRate}
            onChange={(e) => setMoneyRate(parseFloat(e.target.value) || moneyRate)}
            className="h-11 w-24 rounded-2xl border border-white/10 bg-white/5 px-3 text-center text-lg font-bold"
          />
        </div>
      </div>

      {/* Players */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Players ({count})</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="iconSm" onClick={() => bump(-1)} aria-label="Remove player">−</Button>
            <Button variant="ghost" size="iconSm" onClick={() => bump(1)} aria-label="Add player">
              <Plus size={16} />
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {shown.map((n, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="h-5 w-5 shrink-0 rounded-full"
                style={{ background: BALL_HEX[BALL_ORDER[i % BALL_ORDER.length]] }}
              />
              <input
                value={n}
                onChange={(e) => {
                  const next = [...names];
                  next[i] = e.target.value;
                  setNames(next);
                }}
                placeholder={`Player ${i + 1}`}
                className="h-11 flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/60"
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
      </div>

      <Button onClick={start} disabled={validPlayers.length < 2} size="lg" className="w-full">
        Start session <span className="text-sm opacity-70">{validPlayers.length} players</span>
      </Button>
    </div>
  );
}