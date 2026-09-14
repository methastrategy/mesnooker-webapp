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
  moneyPer: "point" | "ball";
  players: Player[];
  frameIds: string[];
  /** cumulative running balance per player */
  runningBalance: Record<string, number>;
  activeFrameId: string;
  status: "live" | "ended";
  moneyRateMismatch?: boolean;
}

export type MoneyRateUnit = "point" | "ball";

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