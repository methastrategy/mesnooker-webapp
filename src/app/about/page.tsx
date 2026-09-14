"use client";

import { motion } from "framer-motion";
import {
  Wallet,
  Target,
  Coins,
  Clock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { GlassCard, Badge } from "@/components/ui";

const FEATURES = [
  { icon: Coins, title: "Money engine", desc: "Thai 'eat the one you bet on' auto-scoring with one-tap settlement, minimal transfers." },
  { icon: Target, title: "Two game modes", desc: "Official point count or fast ball count — pick what your table runs." },
  { icon: Clock, title: "Live scoring", desc: "Tap to pot, foul, miss or pot shots. Break tracking and running totals update instantly." },
  { icon: ShieldCheck, title: "Offline ready", desc: "Progressive Web App — your data stays on-device and works without a connection." },
  { icon: Sparkles, title: "Dark emerald design", desc: "Emerald Noir aesthetic tuned for low-light table play." },
];

const STACK = [
  "Next.js 15",
  "TypeScript",
  "Tailwind CSS v4",
  "Zustand",
  "Recharts",
  "Framer Motion",
  "Lucide Icons",
];

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="flex items-center gap-3 text-3xl font-bold">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <Wallet size={24} />
          </span>
          About
        </h1>
        <p className="text-sm text-muted-foreground">Snooker Money Tracker Pro</p>
      </motion.div>

      <GlassCard glow="emerald" className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Snooker Money Tracker Pro</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Premium snooker scoring and money settlement for Thai players.
            </p>
          </div>
          <Badge variant="gold">v1.0</Badge>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Built for friendly money games, Snooker Money Tracker Pro keeps score, tracks your money
          in real time, and settles the table with minimal transfers so nobody has to do the math.
        </p>
      </GlassCard>

      <div>
        <h3 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Features
        </h3>
        <div className="flex flex-col gap-3">
          {FEATURES.map((f, i) => (
            <GlassCard key={i} className="flex items-start gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <f.icon size={18} />
              </span>
              <div>
                <div className="text-sm font-semibold">{f.title}</div>
                <p className="text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      <GlassCard className="p-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          How the money engine works
        </h3>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            <span className="text-gold">Per point:</span> every point you score is worth your rate,
            and it's paid by the opponent you're targeting. Your target pays for your result.
          </p>
          <p>
            <span className="text-gold">Per ball:</span> instead of points, each potted ball earns
            the rate, paid by your target.
          </p>
          <p>
            Fouls and snooker misses flip the direction — you pay for your opponent's scoring on
            those plays. Since everyone's target forms a cycle, the table always totals zero.
          </p>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          How to play
        </h3>
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <div>
            <div className="font-semibold text-foreground">1 · Point count (official)</div>
            <p>Pot balls for their official points (red 1 → black 7). Higher wins the frame; best break is tracked.</p>
          </div>
          <div>
            <div className="font-semibold text-foreground">2 · Ball count (quick)</div>
            <p>Every potted ball scores the same — get the most balls in. Fouls cost 2 points. Great for fast money sets.</p>
          </div>
          <div>
            <div className="font-semibold text-foreground">3 · Settle</div>
            <p>End the session and the app computes who pays whom, minimising transfers so you settle in one pass.</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Technology
        </h3>
        <div className="flex flex-wrap gap-2">
          {STACK.map((s) => (
            <Badge key={s} variant="neutral">{s}</Badge>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          © 2026 Snooker Money Tracker Pro. Made with care for friendly tables everywhere.
        </p>
      </GlassCard>
    </div>
  );
}