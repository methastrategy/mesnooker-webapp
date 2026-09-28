"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { History, Play } from "lucide-react";
import { useHistory, useGameStore } from "@/store/gameStore";
import { NewSession } from "@/components/game/NewSession";
import { MatchHistoryView } from "@/components/history/MatchHistoryView";
import { t } from "@/lib/i18n";
import type { GameMode, MoneyRateUnit, Player } from "@/types";

/**
 * MatchLanding — Raycast Precision Style.
 * Single unified workspace when no live session is active.
 * Hosts two primary tabs: "New Game" (Setup Wizard) and "Match History" (Full Archives & Ledger Drill-Down).
 */
export function MatchLanding({
  onStart,
}: {
  onStart: (o: {
    players: Player[];
    mode: GameMode;
    moneyRate: number;
    moneyPer: MoneyRateUnit;
    redCount: number;
    tableFee?: number;
  }) => void;
}) {
  const [tab, setTab] = useState<"new" | "history">("new");
  const history = useHistory();
  const locale = useGameStore((s) => s.locale);

  // Check URL search parameters on mount for deep-links like /match?tab=history
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "history") {
        setTab("history");
      }
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 max-w-4xl mx-auto"
    >
      {/* Header — Raycast Precision Typography */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary">
            {tab === "new" ? "Match Setup" : "Match Ledger Archives"}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {tab === "new" ? t("match.title", locale) : t("nav.history", locale)}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {tab === "new"
            ? "Configure players, money rate, and red ball count to start a live session."
            : `${history.length} completed session${history.length === 1 ? "" : "s"} recorded · Full financial settlement & frame breakdown.`}
        </p>
      </div>

      {/* Segmented Control Tabs — Raycast Hairline Precision */}
      <div className="flex items-center gap-1 rounded-[8px] border border-border bg-surface p-1">
        <button
          type="button"
          onClick={() => setTab("new")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-[6px] py-2 text-xs font-semibold transition-all cursor-pointer ${
            tab === "new"
              ? "bg-card text-primary border border-border shadow-xs"
              : "text-muted-foreground hover:bg-card/40 hover:text-foreground"
          }`}
        >
          <Play size={14} className={tab === "new" ? "fill-primary text-primary" : ""} />
          <span>{t("match.newGame", locale)}</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("history")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-[6px] py-2 text-xs font-semibold transition-all cursor-pointer ${
            tab === "history"
              ? "bg-card text-primary border border-border shadow-xs"
              : "text-muted-foreground hover:bg-card/40 hover:text-foreground"
          }`}
        >
          <History size={14} />
          <span>{t("nav.history", locale)}</span>
          <span
            className={`rounded-[4px] px-1.5 py-0.2 text-[10px] font-mono font-bold ${
              tab === "history"
                ? "bg-primary/20 text-primary"
                : "bg-surface border border-border text-muted-foreground"
            }`}
          >
            {history.length}
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      {tab === "new" ? (
        <motion.div
          key="tab-new"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16 }}
        >
          <NewSession onStart={onStart} />
        </motion.div>
      ) : (
        <motion.div
          key="tab-history"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16 }}
        >
          <MatchHistoryView />
        </motion.div>
      )}
    </motion.div>
  );
}
