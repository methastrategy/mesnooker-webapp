"use client";

import { useState } from "react";
import { Minus, Plus, Trash2, ArrowLeft, ArrowRight, Table2, Users } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { BALL_HEX, BALL_ORDER } from "@/lib/rules";
import { AVATAR_PRESETS } from "@/lib/avatar";
import { AvatarPicker } from "@/components/game/AvatarPicker";
import type { GameMode, MoneyRateUnit, Player } from "@/types";
import { uid, cn } from "@/lib/utils";

const STEPS = [
  { id: "table", label: "The Table", icon: Table2 },
  { id: "players", label: "Players & Rate", icon: Users },
];

/**
 * New session setup wizard — Pro Command Cockpit Standard.
 * Concentric squircle cards, tactile buttons, rich baize preview, and smooth ergonomics.
 */
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
  const [step, setStep] = useState(0);
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

  // Money unit follows the game mode automatically
  const moneyPer: MoneyRateUnit = mode === "points" ? "point" : "ball";

  function bump(d: number) {
    const nc = Math.max(2, Math.min(8, count + d));
    setCount(nc);
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
    <div className="glass-strong rounded-[24px] border border-border/80 shadow-2xl backdrop-blur-2xl p-5 sm:p-7 flex flex-col gap-5 select-none relative overflow-hidden">
      {/* Ambient Radial Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
            Configure Match
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {step === 0 ? "Step 1: Select game mode and red ball rack." : "Step 2: Set per-unit rate and player rosters."}
          </p>
        </div>
        <Badge variant="gold" className="font-mono font-bold text-xs px-2.5 py-0.5">
          Step {step + 1} of {STEPS.length}
        </Badge>
      </div>

      {/* Step Progress Pills */}
      <div className="flex items-center gap-2" aria-label="Setup progress">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div
              key={s.id}
              className={cn(
                "flex flex-1 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all shadow-xs",
                isActive
                  ? "border-primary/50 bg-primary/15 text-primary font-bold shadow-md shadow-primary/10"
                  : isDone
                    ? "border-gold/30 bg-surface/90 text-gold"
                    : "border-border/70 bg-surface/60 text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-mono font-bold tabular-nums",
                  isDone
                    ? "bg-gold text-black"
                    : isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-card border border-border text-muted-foreground"
                )}
              >
                {isDone ? "✓" : i + 1}
              </span>
              <Icon size={14} className="shrink-0" />
              <span className="truncate">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* ═══════ STEP 1 — THE TABLE ═══════ */}
      {step === 0 ? (
        <div className="flex flex-col gap-4">
          {/* Mini baize preview */}
          <div className="baize relative rounded-[20px] p-4 shadow-inner border border-white/10">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
                Table Baize Preview
              </span>
              <span className="text-[10px] font-mono font-bold text-muted-foreground">
                {redCount} reds · 6 colours
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 py-1">
              {Array.from({ length: Math.min(redCount, 15) }, (_, i) => (
                <span
                  key={`r${i}`}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-white/20 text-[8px] font-bold text-white shadow-xs"
                  style={{ background: BALL_HEX.red }}
                />
              ))}
              {BALL_ORDER.filter((c) => c !== "red").map((c) => (
                <span
                  key={c}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-white/20 text-[8px] font-bold text-black/80 opacity-90 shadow-xs"
                  style={{ background: BALL_HEX[c] }}
                >
                  {c === "black" ? "7" : c === "brown" ? "4" : ""}
                </span>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div className="rounded-[20px] border border-border/80 bg-surface/90 p-4 shadow-sm">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Scoring Rule Mode
              </span>
              <Badge variant="gold" className="text-[10px] font-mono font-bold">
                {mode === "points" ? "Point Count Standard" : "Ball Count Simple"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant={mode === "points" ? "default" : "outline"}
                className={cn(
                  "h-12 rounded-[16px] text-xs font-bold transition-all",
                  mode === "points" && "shadow-md shadow-primary/25"
                )}
                onClick={() => setMode("points")}
              >
                Point Count (1-7 pts)
              </Button>
              <Button
                variant={mode === "balls" ? "default" : "outline"}
                className={cn(
                  "h-12 rounded-[16px] text-xs font-bold transition-all",
                  mode === "balls" && "shadow-md shadow-primary/25"
                )}
                onClick={() => setMode("balls")}
              >
                Ball Count (1-2 pts)
              </Button>
            </div>
            <p className="mt-2 text-[11px] font-mono text-muted-foreground">
              {mode === "points"
                ? "Official snooker points: red=1, yellow=2 … black=7 · Foul −4"
                : "Simplified stakes: every colour 1 (brown/black 2) · Foul −2"}
            </p>
          </div>

          {/* Red count */}
          <div className="rounded-[20px] border border-border/80 bg-surface/90 p-4 shadow-sm">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Starting Red Balls
              </span>
              <span className="text-xs font-mono font-bold text-foreground">
                {redCount} Reds Rack
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {[6, 10, 15].map((n) => (
                <Button
                  key={n}
                  variant={redCount === n ? "default" : "outline"}
                  className={cn(
                    "h-11 rounded-[16px] text-xs font-mono font-bold transition-all",
                    redCount === n && "shadow-md shadow-primary/25"
                  )}
                  onClick={() => setRedCount(n)}
                >
                  {n} Reds
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => setStep(1)}
            size="lg"
            className="w-full h-12 rounded-full font-bold shadow-lg shadow-primary/25 gap-2 text-sm"
          >
            <span>Proceed to Players & Rate</span>
            <ArrowRight size={16} />
          </Button>
        </div>
      ) : (
        /* ═══════ STEP 2 — PLAYERS & RATE ═══════ */
        <div className="flex flex-col gap-4">
          {/* Rate Setup */}
          <div className="rounded-[20px] border border-border/80 bg-surface/90 p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Financial Rate Per {moneyPer.toUpperCase()}
              </span>
              <span className="text-[10px] font-mono text-gold font-bold">
                Dynamic Settlement
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-full shrink-0"
                onClick={() => setMoneyRate(Math.max(0.5, moneyRate - 0.5))}
                aria-label="Decrease rate"
              >
                <Minus size={16} />
              </Button>
              <div className="flex h-11 flex-1 items-center justify-center rounded-full border border-gold/40 bg-card/85 px-4 text-center font-mono font-black text-gold text-lg sm:text-xl shadow-xs">
                ฿{moneyRate.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
                <span className="text-xs font-normal text-gold/75 ml-1">/{moneyPer}</span>
              </div>
              <Button
                variant="gold"
                size="icon"
                className="h-11 w-11 rounded-full shrink-0 shadow-md shadow-gold/25"
                onClick={() => setMoneyRate(moneyRate + 0.5)}
                aria-label="Increase rate"
              >
                <Plus size={16} />
              </Button>
            </div>
            <p className="mt-2 text-[11px] font-mono text-muted-foreground">
              Money rate is {moneyPer === "point" ? "per point scored" : "per ball potted"}, automatically synced to game mode.
            </p>
          </div>

          {/* Players Roster */}
          <div className="rounded-[20px] border border-border/80 bg-surface/90 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Players Roster ({count})
              </span>
              <div className="flex items-center gap-1 rounded-full border border-border/80 bg-card p-1 shadow-xs">
                <Button
                  variant="ghost"
                  size="iconSm"
                  className="rounded-full h-6 w-6"
                  onClick={() => bump(-1)}
                  aria-label="Remove player"
                >
                  <Minus size={13} />
                </Button>
                <span className="min-w-6 text-center font-bold font-mono text-xs tabular-nums text-foreground">
                  {count}
                </span>
                <Button
                  variant="ghost"
                  size="iconSm"
                  className="rounded-full h-6 w-6"
                  onClick={() => bump(1)}
                  aria-label="Add player"
                >
                  <Plus size={13} />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {shown.map((n, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-[18px] border border-border/80 bg-card/85 p-2.5 shadow-xs"
                >
                  <AvatarPicker value={avatars[i] ?? ""} onChange={(v) => setAvatar(i, v)} />
                  <input
                    value={n}
                    onChange={(e) => {
                      const next = [...names];
                      next[i] = e.target.value;
                      setNames(next);
                    }}
                    placeholder={`Player ${i + 1}`}
                    className="h-10 min-w-0 flex-1 rounded-xl border border-border/80 bg-surface px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/60 transition-all text-foreground placeholder:text-muted-foreground/60"
                  />
                  {i > 0 && (
                    <Button
                      variant="ghost"
                      size="iconSm"
                      className="rounded-full h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        const next = [...names];
                        next[i] = "";
                        setNames(next);
                      }}
                      aria-label="Clear name"
                    >
                      <Trash2 size={13} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2.5 text-[11px] font-mono text-muted-foreground">
              Tap any avatar bubble to upload, select from presets, or randomize. Minimum 2 players required.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <Button
              variant="outline"
              size="lg"
              className="h-12 rounded-full font-semibold gap-1.5"
              onClick={() => setStep(0)}
              aria-label="Back to table settings"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </Button>
            <Button
              onClick={start}
              disabled={validPlayers.length < 2}
              size="lg"
              className="flex-1 h-12 rounded-full font-bold shadow-lg shadow-primary/25 gap-2 text-sm"
            >
              <span>Start Match Session</span>
              <span className="text-xs font-normal opacity-85">
                ({validPlayers.length} Players)
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}