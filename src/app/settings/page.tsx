"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Coins,
  Dice5,
  Gamepad2,
  Volume2,
  Vibrate,
  Palette,
  Languages,
  Bell,
  Trash2,
} from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { GlassCard, Badge, Button } from "@/components/ui";
import type { GameMode, MoneyRateUnit } from "@/types";

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      aria-pressed={on}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        on ? "bg-primary" : "bg-white/15"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
          on ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

function Row({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Coins;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-2 py-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-primary">
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const session = useGameStore((s) => s.session);
  const mode = useGameStore((s) => s.mode);
  const moneyRate = useGameStore((s) => s.moneyRate);
  const moneyPer = useGameStore((s) => s.moneyPer);
  const sound = useGameStore((s) => s.sound);
  const haptics = useGameStore((s) => s.haptics);
  const setMoneyRate = useGameStore((s) => s.setMoneyRate);
  const setMoneyPer = useGameStore((s) => s.setMoneyPer);
  const setMode = useGameStore((s) => s.setMode);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const toggleHaptics = useGameStore((s) => s.toggleHaptics);

  const [notifications, setNotifications] = useState(true);
  const [rateInput, setRateInput] = useState<string>(String(moneyRate));

  const commitRate = (raw: string) => {
    setRateInput(raw);
    const n = parseFloat(raw);
    if (!Number.isNaN(n) && n >= 0) setMoneyRate(n);
  };

  const resetApp = () => {
    if (window.confirm("Reset all data? This clears every session, frame, player and stat.")) {
      try {
        localStorage.clear();
      } catch {
        /* noop */
      }
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <SettingsIcon size={26} className="text-primary" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          {session ? "Live session active — changes apply to new frames" : "Adjust how your game scores money"}
        </p>
      </motion.div>

      {/* Money engine */}
      <GlassCard className="divide-y divide-white/5 p-4">
        <h3 className="mb-2 px-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Money engine
        </h3>

        <Row icon={Coins} title="Rate" subtitle="Money value per unit">
          <input
            type="number"
            value={rateInput}
            onChange={(e) => commitRate(e.target.value)}
            min="0"
            step="0.5"
            inputMode="decimal"
            className="h-10 w-24 rounded-xl bg-white/5 px-3 text-right text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/60 [color-scheme:dark]"
          />
        </Row>

        <Row icon={Gamepad2} title="Scoring mode" subtitle={mode === "points" ? "Point count" : "Ball count"}>
          <div className="flex rounded-xl bg-white/5 p-1">
            {(["points", "balls"] as GameMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {m === "points" ? "Points" : "Balls"}
              </button>
            ))}
          </div>
        </Row>

        <Row icon={Dice5} title="Money per" subtitle={moneyPer === "point" ? "Per point scored" : "Per ball potted"}>
          <div className="flex rounded-xl bg-white/5 p-1">
            {(["point", "ball"] as MoneyRateUnit[]).map((u) => (
              <button
                key={u}
                onClick={() => setMoneyPer(u)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  moneyPer === u ? "bg-gold text-black" : "text-muted-foreground"
                }`}
              >
                {u === "point" ? "Point" : "Ball"}
              </button>
            ))}
          </div>
        </Row>
      </GlassCard>

      {/* Preferences */}
      <GlassCard className="divide-y divide-white/5 p-4">
        <h3 className="mb-2 px-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Preferences
        </h3>

        <Row icon={Volume2} title="Sound" subtitle="Timers and alerts">
          <Toggle on={sound} onChange={toggleSound} />
        </Row>

        <Row icon={Vibrate} title="Haptics" subtitle="Tactile feedback">
          <Toggle on={haptics} onChange={toggleHaptics} />
        </Row>

        <Row icon={Bell} title="Notifications" subtitle="Session reminders">
          <Toggle on={notifications} onChange={() => setNotifications(!notifications)} />
        </Row>

        <Row
          icon={Languages}
          title="Language"
          subtitle="App display language"
        >
          <Badge variant="neutral">English</Badge>
        </Row>

        <Row icon={Palette} title="Theme" subtitle="Emerald Noir">
          <div className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-full" style={{ background: "#16c784" }} />
            <span className="h-4 w-4 rounded-full" style={{ background: "#f59e0b" }} />
            <span className="h-4 w-4 rounded-full" style={{ background: "#050505", border: "1px solid rgba(255,255,255,0.2)" }} />
            <Badge variant="success">Fixed</Badge>
          </div>
        </Row>
      </GlassCard>

      {/* Danger zone */}
      <GlassCard glow="none" className="p-4">
        <h3 className="mb-3 px-2 pt-1 text-xs font-semibold uppercase tracking-wider text-destructive">
          Danger zone
        </h3>
        <Button variant="danger" className="w-full" onClick={resetApp}>
          <Trash2 size={16} /> Reset app
        </Button>
        <p className="mt-2 px-1 text-xs text-muted-foreground">
          Erases all persisted data stored on this device and reloads the app.
        </p>
      </GlassCard>
    </div>
  );
}