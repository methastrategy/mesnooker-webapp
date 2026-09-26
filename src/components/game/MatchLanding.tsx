"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, History, ChevronRight, Trophy, Clock } from "lucide-react";
import { useHistory } from "@/store/gameStore";
import { NewSession } from "@/components/game/NewSession";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { Badge } from "@/components/ui";
import { formatMoney, formatDateTime } from "@/lib/utils";
import type { ArchivedGame, GameMode, MoneyRateUnit, Player } from "@/types";

/** Match page landing — shown when there is no active session.
 *  Two tabs: "New Game" (the NewSession wizard) and "Recent" (last 5 sessions
 *  from history as quick-start shortcuts). */
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
  const [tab, setTab] = useState<"new" | "recent">("new");
  const history = useHistory();
  const recent = history.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5"
    >
      {/* Hero header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            🎱 Match
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {history.length > 0
              ? `${history.length} game${history.length > 1 ? "s" : ""} played · Start a new session or pick up from history`
              : "Set up your table and start your first session"}
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-2xl bg-white/[0.04] p-1">
        <TabButton
          active={tab === "new"}
          onClick={() => setTab("new")}
          icon={<Plus size={15} />}
          label="New Game"
        />
        <TabButton
          active={tab === "recent"}
          onClick={() => setTab("recent")}
          icon={<History size={15} />}
          label={`Recent (${history.length})`}
          disabled={history.length === 0}
        />
      </div>

      {/* Tab content */}
      {tab === "new" ? (
        <motion.div
          key="new"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
        >
          <NewSession onStart={onStart} />
        </motion.div>
      ) : (
        <motion.div
          key="recent"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col gap-3"
        >
          {recent.length === 0 ? (
            <div className="glass p-8 text-center text-muted-foreground">
              No finished games yet
            </div>
          ) : (
            recent.map((game) => <RecentGameCard key={game.id} game={game} />)
          )}
          {history.length > 5 && (
            <a
              href="/history"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.07] hover:text-foreground"
            >
              View all {history.length} sessions
              <ChevronRight size={15} />
            </a>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all ${
        active
          ? "bg-primary/20 text-primary shadow-sm"
          : disabled
            ? "text-muted-foreground/40 cursor-not-allowed"
            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/** Compact recent-session card — shows players, scores, and final money */
function RecentGameCard({ game }: { game: ArchivedGame }) {
  const sortedPlayers = [...game.players].sort(
    (a, b) => (game.balances[b.id] ?? 0) - (game.balances[a.id] ?? 0)
  );
  const winner = sortedPlayers[0];
  const winnerBalance = game.balances[winner?.id] ?? 0;

  return (
    <div className="glass flex flex-col gap-3 p-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">
            {formatDateTime(game.endedAt)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">
            {game.frames} frame{game.frames > 1 ? "s" : ""}
          </Badge>
          <Badge variant={game.mode === "points" ? "default" : "gold"}>
            {game.mode === "points" ? "point count" : "ball count"}
          </Badge>
        </div>
      </div>

      {/* Winner callout */}
      {winner && winnerBalance > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-gold/10 px-3 py-1.5">
          <Trophy size={14} className="text-gold shrink-0" />
          <AvatarBubble avatar={winner.avatar} size={20} />
          <span className="text-sm font-semibold text-gold">{winner.nickname}</span>
          <span className="ml-auto text-sm font-bold text-gold tabular-nums">
            +{formatMoney(winnerBalance)}
          </span>
        </div>
      )}

      {/* All players balances */}
      <div className="flex flex-wrap gap-2">
        {sortedPlayers.map((p) => {
          const bal = game.balances[p.id] ?? 0;
          const color =
            bal === 0
              ? "text-muted-foreground"
              : bal > 0
                ? "text-primary"
                : "text-destructive";
          return (
            <div
              key={p.id}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1"
            >
              <AvatarBubble avatar={p.avatar} size={18} />
              <span className="text-[12px] font-medium">{p.nickname}</span>
              <span className={`text-[12px] font-bold tabular-nums ${color}`}>
                {bal > 0 ? "+" : ""}
                {formatMoney(bal)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
