"use client";

import { useState, useCallback } from "react";
import {
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Play,
  Table2,
  Users,
  Shuffle,
  Sparkles,
  Check,
  Coins,
} from "lucide-react";
import { BALL_HEX, BALL_ORDER } from "@/lib/rules";
import { AVATAR_PRESETS } from "@/lib/avatar";
import { AvatarPicker } from "@/components/game/AvatarPicker";
import { useGameStore } from "@/store/gameStore";
import type { GameMode, MoneyRateUnit, Player } from "@/types";
import { uid, cn } from "@/lib/utils";
import { shuffleRoster } from "@/lib/roster";

const RATE_PRESETS = [1, 2, 5, 10, 20, 50];

const STEPS = [
  { id: "table", labelTh: "โต๊ะและกติกา", labelEn: "The Table", icon: Table2 },
  { id: "players", labelTh: "ผู้เล่นและเรท", labelEn: "Players & Stakes", icon: Users },
];

/**
 * New session setup wizard — Linear Pro Cockpit Architecture.
 * Concentric keycaps, tactile stepper controls, ergonomic start trigger, and zero pill-bloat.
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
  const locale = useGameStore((s) => s.locale);
  const [step, setStep] = useState<0 | 1>(0);
  const [mode, setMode] = useState<GameMode>("points");
  const [moneyRate, setMoneyRate] = useState<number>(1);
  const [names, setNames] = useState<string[]>(
    initialPlayers?.map((p) => p.nickname) ?? ["Metha", "Player 2"]
  );
  const [avatars, setAvatars] = useState<string[]>(
    initialPlayers?.map((p) => p.avatar ?? "") ?? [AVATAR_PRESETS[0], AVATAR_PRESETS[1]]
  );
  const [count, setCount] = useState<number>(2);
  const [redCount, setRedCount] = useState<number>(15);
  const [isShuffling, setIsShuffling] = useState(false);

  const shown = names.slice(0, count);
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

  const shufflePlayers = useCallback(() => {
    if (count < 2) return;
    setIsShuffling(true);

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.([15]);
      } catch {}
    }

    const { names: nextNames, avatars: nextAvatars } = shuffleRoster(names, avatars, count);
    setNames(nextNames);
    setAvatars(nextAvatars);

    setTimeout(() => setIsShuffling(false), 300);
  }, [names, avatars, count]);

  const apply4PlayerPreset = useCallback(() => {
    setCount(4);
    setMode("balls");
    setNames(["เม", "อุ้ม", "ฟุค", "นน"]);
    setAvatars([
      AVATAR_PRESETS[0] || "🎱",
      AVATAR_PRESETS[1] || "🍀",
      AVATAR_PRESETS[2] || "🔥",
      AVATAR_PRESETS[3] || "🦁",
    ]);
  }, []);

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
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 p-4 sm:p-6 md:p-7 shadow-xs select-none flex flex-col gap-5">
      {/* Top Header & Step Tracker */}
      <div className="flex flex-col gap-3 pb-3 border-b border-border/70">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-heading">
              {locale === "th" ? "ตั้งค่าการแข่งขัน" : "Match Configuration"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step === 0
                ? locale === "th"
                  ? "ขั้นตอนที่ 1: กำหนดกติกาการนับคะแนนและจำนวนลูกแดง"
                  : "Step 1: Choose scoring rule & red ball rack."
                : locale === "th"
                  ? "ขั้นตอนที่ 2: กำหนดเรทเดิมพันและรายชื่อผู้เล่น"
                  : "Step 2: Set per-unit stakes & player roster."}
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface/80 px-2.5 py-1 text-xs font-mono font-bold text-foreground">
            <span className="text-primary">{step + 1}</span>
            <span className="text-muted-foreground">/</span>
            <span>2</span>
          </div>
        </div>

        {/* 2-Step Segmented Navigation */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface/80 border border-border/70">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(i as 0 | 1)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-all cursor-pointer",
                  isActive
                    ? "bg-card text-primary font-bold shadow-xs border border-primary/30"
                    : isDone
                      ? "text-foreground/80 hover:text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-mono font-bold",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isDone
                        ? "bg-primary/20 text-primary"
                        : "bg-surface text-muted-foreground border border-border"
                  )}
                >
                  {isDone ? "✓" : i + 1}
                </span>
                <Icon size={14} className={isActive ? "text-primary" : "text-muted-foreground"} />
                <span className="truncate">{locale === "th" ? s.labelTh : s.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════ STEP 0: THE TABLE & RULES ═══════ */}
      {step === 0 ? (
        <div className="flex flex-col gap-4">
          {/* Mini Baize Preview */}
          <div className="rounded-xl border border-border/80 bg-surface/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
                {locale === "th" ? "จำลองผืนผ้าสักหลาด" : "Baize Preview"}
              </span>
              <span className="text-foreground font-semibold">
                {redCount} {locale === "th" ? "แดง" : "reds"} · 6 {locale === "th" ? "สี" : "colours"}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-lg bg-surface/90 border border-border/60">
              {Array.from({ length: Math.min(redCount, 15) }, (_, i) => (
                <span
                  key={`r${i}`}
                  className="flex h-4.5 w-4.5 sm:h-5 sm:w-5 items-center justify-center rounded-full border border-white/20 text-[8px] font-bold text-white shadow-xs"
                  style={{ background: BALL_HEX.red }}
                />
              ))}
              {BALL_ORDER.filter((c) => c !== "red").map((c) => (
                <span
                  key={c}
                  className="flex h-4.5 w-4.5 sm:h-5 sm:w-5 items-center justify-center rounded-full border border-white/20 text-[8px] font-bold text-black/80 shadow-xs"
                  style={{ background: BALL_HEX[c] }}
                />
              ))}
            </div>
          </div>

          {/* Scoring Mode Options */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground block">
              {locale === "th" ? "ระบบคิดคะแนน (Game Mode)" : "Scoring Rule Mode"}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option: Points */}
              <button
                type="button"
                onClick={() => setMode("points")}
                className={cn(
                  "p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                  mode === "points"
                    ? "border-primary/60 bg-primary/10 shadow-xs"
                    : "border-border/80 bg-surface/60 hover:border-border hover:bg-surface/90"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">
                    {locale === "th" ? "แต้มสากล (Point Count)" : "Point Count Standard"}
                  </span>
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center",
                      mode === "points" ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    )}
                  >
                    {mode === "points" && <Check size={10} className="stroke-[3]" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {locale === "th"
                    ? "แดง 1 แต้ม, เหลือง 2 … ดำ 7 แต้ม (ฟาวล์ −4 ถึง −7)"
                    : "Official values 1–7 points. Standard fouls (−4 to −7)."}
                </p>
              </button>

              {/* Option: Balls */}
              <button
                type="button"
                onClick={() => setMode("balls")}
                className={cn(
                  "p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                  mode === "balls"
                    ? "border-primary/60 bg-primary/10 shadow-xs"
                    : "border-border/80 bg-surface/60 hover:border-border hover:bg-surface/90"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">
                    {locale === "th" ? "นับลูก (Ball Count)" : "Ball Count Simple"}
                  </span>
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center",
                      mode === "balls" ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    )}
                  >
                    {mode === "balls" && <Check size={10} className="stroke-[3]" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {locale === "th"
                    ? "นับลูกละ 1 (ชมพู/ดำ 2 ลูก) เกมจบไว คิดเงินง่าย (ฟาวล์ −2)"
                    : "Reds & colours count as 1 (pink/black as 2). Foul −2."}
                </p>
              </button>
            </div>
          </div>

          {/* Red Balls Count */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground block">
              {locale === "th" ? "จำนวนลูกแดงบนโต๊ะ" : "Starting Red Balls"}
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[6, 10, 15].map((n) => {
                const isSelected = redCount === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRedCount(n)}
                    className={cn(
                      "h-11 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                      isSelected
                        ? "border-primary/60 bg-primary text-primary-foreground shadow-xs font-black"
                        : "border-border/80 bg-surface/70 text-foreground hover:bg-surface hover:border-border"
                    )}
                  >
                    <span>{n}</span>
                    <span className="text-[11px] font-normal opacity-90">{locale === "th" ? "แดง" : "Reds"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Proceed Button */}
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full h-12 sm:h-13 rounded-xl border border-primary/50 bg-primary text-primary-foreground font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs hover:bg-primary-hover active:scale-[0.985] transition-all cursor-pointer mt-2"
          >
            <span>{locale === "th" ? "ถัดไป: ผู้เล่นและเรทเงิน" : "Proceed to Players & Rate"}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        /* ═══════ STEP 1: PLAYERS & STAKES ═══════ */
        <div className="flex flex-col gap-4">
          {/* Rate & Stake Selector */}
          <div className="rounded-xl border border-border/80 bg-surface/80 p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins size={15} className="text-amber-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                  {locale === "th"
                    ? `เรทเดิมพันต่อ${moneyPer === "point" ? "แต้ม" : "ลูก"}`
                    : `Stake Rate per ${moneyPer}`}
                </span>
              </div>
              <span className="text-[11px] font-mono text-amber-400 font-bold">
                {locale === "th" ? "หักลบหนี้อัตโนมัติ" : "Dynamic Settlement"}
              </span>
            </div>

            {/* Stepper with Rate Display */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setMoneyRate(Math.max(0.5, moneyRate - 0.5))}
                className="h-11 w-11 rounded-xl border border-border/80 bg-card hover:bg-surface text-foreground font-bold flex items-center justify-center transition-all active:scale-[0.96] cursor-pointer shrink-0 shadow-xs"
                aria-label="Decrease stake rate"
              >
                <Minus size={18} />
              </button>

              <div className="flex h-11 flex-1 items-center justify-center rounded-xl border border-amber-500/40 bg-card px-4 font-mono font-bold text-amber-400 text-xl sm:text-2xl tabular-nums shadow-xs">
                <span>฿{moneyRate.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}</span>
                <span className="text-xs font-normal text-muted-foreground ml-1.5">
                  /{moneyPer === "point" ? (locale === "th" ? "แต้ม" : "pt") : (locale === "th" ? "ลูก" : "ball")}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMoneyRate(moneyRate + 0.5)}
                className="h-11 w-11 rounded-xl border border-border/80 bg-card hover:bg-surface text-foreground font-bold flex items-center justify-center transition-all active:scale-[0.96] cursor-pointer shrink-0 shadow-xs"
                aria-label="Increase stake rate"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Quick Stake Preset Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-mono text-muted-foreground mr-1">
                {locale === "th" ? "เรทด่วน:" : "Quick:"}
              </span>
              {RATE_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setMoneyRate(p)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer",
                    moneyRate === p
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold"
                      : "bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:bg-surface"
                  )}
                >
                  ฿{p}
                </button>
              ))}
            </div>
          </div>

          {/* Player Roster Section */}
          <div className="rounded-xl border border-border/80 bg-surface/80 p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-primary" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                  {locale === "th" ? `รายชื่อผู้เล่น (${count} คน)` : `Players Roster (${count})`}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* 4-player quick preset */}
                <button
                  type="button"
                  onClick={apply4PlayerPreset}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-mono font-semibold hover:bg-amber-500/20 transition-all cursor-pointer"
                  title="โหลดผู้เล่น 4 คนอัตโนมัติ"
                >
                  <Sparkles size={11} className="text-amber-400" />
                  <span>4 คน (เม, อุ้ม, ฟุค, นน)</span>
                </button>

                {/* Shuffle button */}
                <button
                  type="button"
                  onClick={shufflePlayers}
                  disabled={count < 2}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-primary/40 bg-primary/10 text-primary text-xs font-mono font-semibold hover:bg-primary/20 transition-all cursor-pointer"
                  title="สุ่มลำดับคิวผู้เล่น"
                >
                  <Shuffle
                    size={11}
                    className={cn("transition-transform", isShuffling && "rotate-180 duration-300")}
                  />
                  <span>{locale === "th" ? "สุ่มคิว" : "Shuffle"}</span>
                </button>

                {/* Stepper for player count */}
                <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-card p-0.5">
                  <button
                    type="button"
                    onClick={() => bump(-1)}
                    disabled={count <= 2}
                    className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                    aria-label="Decrease player count"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="min-w-6 text-center font-mono font-bold text-xs tabular-nums text-foreground">
                    {count}
                  </span>
                  <button
                    type="button"
                    onClick={() => bump(1)}
                    disabled={count >= 8}
                    className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                    aria-label="Increase player count"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Players list */}
            <div className="flex flex-col gap-2">
              {shown.map((n, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card p-2 sm:p-2.5 shadow-xs"
                >
                  {/* Queue order tag */}
                  <span
                    className={cn(
                      "flex h-7 min-w-7 items-center justify-center rounded-lg text-xs font-mono font-bold shrink-0",
                      i === 0
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-surface text-muted-foreground border border-border/70"
                    )}
                    title={i === 0 ? "ผู้เปิดเฟรม (Opener)" : `คิวที่ ${i + 1}`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Avatar Picker bubble */}
                  <div className="shrink-0">
                    <AvatarPicker value={avatars[i] ?? ""} onChange={(v) => setAvatar(i, v)} />
                  </div>

                  {/* Name text input */}
                  <div className="relative flex-1 min-w-0 flex items-center gap-1.5">
                    <input
                      value={n}
                      onChange={(e) => {
                        const next = [...names];
                        next[i] = e.target.value;
                        setNames(next);
                      }}
                      placeholder={`Player ${i + 1}`}
                      className="h-9 min-w-0 flex-1 rounded-lg border border-border/70 bg-surface/90 px-3 text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/60 transition-colors"
                    />

                    {i === 0 && (
                      <span className="hidden sm:inline-block rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold bg-primary/15 text-primary border border-primary/30 uppercase tracking-wider shrink-0">
                        {locale === "th" ? "เปิดเฟรม" : "Opener"}
                      </span>
                    )}
                  </div>

                  {/* Clear button */}
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...names];
                        next[i] = "";
                        setNames(next);
                      }}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-surface/80 transition-colors cursor-pointer shrink-0"
                      aria-label="Clear player name"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
              {locale === "th"
                ? "💡 แตะที่รูปอิโมจิเพื่อเปลี่ยนอวาตาร์ หรือกดปุ่ม \"สุ่มคิว\" เพื่อสลับลำดับการเปิดเฟรมก่อนเริ่มแข่ง"
                : "💡 Tap an avatar to customize. Tap \"Shuffle\" to randomize breaking order."}
            </p>
          </div>

          {/* ═══════ BOTTOM COMMAND DECK & START BUTTON ═══════ */}
          <div className="flex items-center gap-2.5 pt-2">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => setStep(0)}
              className="h-12 sm:h-13 px-4 sm:px-5 rounded-xl border border-border/80 bg-surface/80 hover:bg-surface text-foreground font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.985] cursor-pointer shrink-0 shadow-xs"
              aria-label="Back to step 1"
            >
              <ArrowLeft size={16} />
              <span>{locale === "th" ? "ย้อนกลับ" : "Back"}</span>
            </button>

            {/* Dominant Executive START MATCH BUTTON */}
            <button
              type="button"
              onClick={start}
              disabled={count < 2}
              className="flex-1 h-12 sm:h-13 px-4 sm:px-6 rounded-xl border border-primary/60 bg-primary text-primary-foreground font-black text-sm sm:text-base flex items-center justify-between shadow-xs hover:bg-primary-hover active:scale-[0.985] active:translate-y-[1px] transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Start match session"
            >
              <div className="flex items-center gap-2">
                <Play size={17} className="fill-current shrink-0" />
                <span className="tracking-wide">
                  {locale === "th" ? "เริ่มการแข่งขัน" : "Start Match Session"}
                </span>
              </div>

              <span className="px-2.5 py-0.5 rounded-lg bg-black/20 text-primary-foreground font-mono font-bold text-xs border border-black/15 tabular-nums shrink-0">
                {count} {locale === "th" ? "ผู้เล่น" : "Players"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
