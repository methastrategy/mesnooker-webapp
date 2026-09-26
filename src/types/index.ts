/** Core domain types for Snooker Money Tracker Pro */

export type GameMode = "points" | "balls";

export type BallColor =
  | "red"
  | "yellow"
  | "green"
  | "brown"
  | "blue"
  | "pink"
  | "black";

export type EventType =
  | "pot"
  | "foul"
  | "snooker_miss"
  | "snooker_hit"
  | "end_turn"
  | "undo"
  | "end_frame"
  | "new_frame";

export interface Player {
  id: string;
  nickname: string;
  color: BallColor;
  avatar?: string;
  /** persistent lifetime stats */
  lifetime?: PlayerLifetime;
}

export interface PlayerLifetime {
  framesWon: number;
  moneyEarned: number;
  moneyLost: number;
  sessions: number;
  highestBreakLifetime: number;
}

export interface GameEvent {
  id: string;
  ts: number;
  playerId: string;
  playerName: string;
  targetId?: string;
  targetName?: string;
  type: EventType;
  ball?: BallColor;
  points: number;
  breakValue?: number;
  frameId: string;
  turnIndex: number;
  undone?: boolean;
}

export interface BallCounts {
  red: number;
  yellow: number;
  green: number;
  brown: number;
  blue: number;
  pink: number;
  black: number;
}

export interface FrameSnapshot {
  id: string;
  startedAt: number;
  endedAt?: number;
  mode: GameMode;
  /** playerId -> points */
  scores: Record<string, number>;
  /** net money result per player for this frame */
  money: Record<string, number>;
  winnerId?: string;
  highestBreak: number;
  highestBreakPlayerId?: string;
  breaks: Record<string, number>;
  fouls: Record<string, number>;
  snookerMisses: Record<string, number>;
  snookerHits: Record<string, number>;
  targetCycle: Record<string, string>;
  ballCountsEnd?: BallCounts;
  eventIds: string[];
}

export interface SessionSummary {
  id: string;
  createdAt: number;
  mode: GameMode;
  moneyRate: number;
  moneyPer: MoneyRateUnit;
  /** total table fee (฿) split evenly among players at settlement */
  tableFee: number;
  /** number of red balls in play (6/10/15) */
  redCount: number;
  players: Player[];
  frameIds: string[];
  /** cumulative running balance per player */
  runningBalance: Record<string, number>;
  activeFrameId: string;
  status: "live" | "ended";
  moneyRateMismatch?: boolean;
  /** index (in players[]) of who should break next frame — set by auto-end-frame on black */
  nextFrameFirstShooter?: number;
}

export type MoneyRateUnit = "point" | "ball";

/** A finished game archived into history with its final money result. */
export interface ArchivedGame {
  id: string;
  endedAt: number;
  mode: GameMode;
  moneyRate: number;
  moneyPer: MoneyRateUnit;
  redCount: number;
  /** total table fee split evenly at settlement */
  tableFee: number;
  players: Player[];
  /** winnings before any table fee (source for adjusting the fee after the game) */
  rawBalances: Record<string, number>;
  /** final net money per playerId (the settlement basis) */
  balances: Record<string, number>;
  frames: number;
  totalPoints: number;
  /** per-frame analytics snapshot, captured when the session was archived.
   *  Optional so older archived games (which predate frame details) still
   *  render; when absent the History detail view falls back to the session
   *  summary only. */
  frameDetails?: ArchivedFrame[];
}

/** Per-frame snapshot for the History drill-down. Captured at archive time so
 *  it is immutable and survives store resets. */
export interface ArchivedFrame {
  /** 0-based index into the session's frame sequence */
  index: number;
  startedAt: number;
  endedAt?: number;
  mode: GameMode;
  /** playerId -> points score this frame */
  scores: Record<string, number>;
  /** playerId -> net money this frame */
  money: Record<string, number>;
  winnerId?: string;
  highestBreak: number;
  breaks: Record<string, number>;
  fouls: Record<string, number>;
  snookerMisses: Record<string, number>;
  snookerHits: Record<string, number>;
  /** playerId -> potted-ball counts (start minus remaining); includes re-spotted
   *  colour count from startCounts so cleared-table frames are readable */
  potted: Record<string, BallCounts>;
  /** per-colour totals across all players this frame */
  totalPotted: BallCounts;
}

export type SettlementPayment = {
  id: string;
  fromPlayerId: string;
  fromName: string;
  toPlayerId: string;
  toName: string;
  amount: number;
  status: "pending" | "paid" | "partial";
  paidAmount: number;
  ts: number;
};