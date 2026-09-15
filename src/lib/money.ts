import type { BallCounts, BallColor, GameMode, MoneyRateUnit, Player } from "@/types";
import { ballValue } from "./rules";

export interface MoneyResult {
  /** net money per playerId */
  net: Record<string, number>;
  /** directed flow per player: playerId owes targetId the amount contributed */
  flows: Array<{ fromId: string; toId: string; amount: number }>;
}

const BALL_START_TOTAL: Record<BallColor, number> = {
  red: 15,
  yellow: 1,
  green: 1,
  brown: 1,
  blue: 1,
  pink: 1,
  black: 1,
};

/** number of balls actually potted for this player (start count - current) */
export function ballsPotted(counts: BallCounts): number {
  let t = 0;
  for (const c of Object.keys(BALL_START_TOTAL) as BallColor[]) {
    t += BALL_START_TOTAL[c] - counts[c];
  }
  return t;
}

/**
 * Money engine.
 *
 * Core rule (Thai "eat the one you bet on"): each player scores points; the
 * money value of those points is paid BY the player's target. So:
 *   net[scorer] += value      (scorer earns from target)
 *   net[target] -= value      (target pays for scorer's results)
 * Negative points (fouls/snooker misses) simply flip the direction.
 * Because targets form a cycle, the table always sums to zero.
 *
 * - Money-per-point: value = points × rate
 * - Money-per-ball:  value = ballsPotted × rate
 */
export function computeFrameMoney(args: {
  mode: GameMode;
  players: Player[];
  scores: Record<string, number>;
  ballCounts?: Record<string, BallCounts>;
  targetCycle: Record<string, string>;
  moneyPer: MoneyRateUnit;
  moneyRate: number;
}): MoneyResult {
  const { players, scores, targetCycle, moneyPer, moneyRate } = args;
  const net: Record<string, number> = {};
  const flows: MoneyResult["flows"] = [];

  for (const p of players) {
    const id = p.id;
    let value: number;
    if (moneyPer === "ball") {
      // ballCounts here = per-player potted-ball counts (sum of all colours)
      const counts = args.ballCounts?.[id];
      const pottedTotal = counts
        ? Object.values(counts).reduce((a, b) => a + b, 0)
        : (scores[id] ?? 0);
      value = pottedTotal * moneyRate;
    } else {
      value = (scores[id] ?? 0) * moneyRate;
    }

    if (Math.abs(value) < 1e-9) continue;

    net[id] = (net[id] ?? 0) + value;
    const targetId = targetCycle[id];
    if (targetId) {
      net[targetId] = (net[targetId] ?? 0) - value;
      if (value > 0) {
        flows.push({ fromId: targetId, toId: id, amount: Math.round(value * 100) / 100 });
      } else {
        flows.push({ fromId: id, toId: targetId, amount: Math.round(-value * 100) / 100 });
      }
    }
  }

  for (const k of Object.keys(net)) net[k] = Math.round(net[k] * 100) / 100;
  return { net, flows };
}

/** Merge a frame's net into a running balance. */
export function mergeRunning(
  running: Record<string, number>,
  frameNet: Record<string, number>
): Record<string, number> {
  const out: Record<string, number> = { ...running };
  for (const [k, v] of Object.entries(frameNet)) out[k] = (out[k] ?? 0) + v;
  for (const k of Object.keys(out)) out[k] = Math.round(out[k] * 100) / 100;
  return out;
}

export interface SettlementInstruction {
  fromPlayerId: string;
  fromName: string;
  toPlayerId: string;
  toName: string;
  amount: number;
}

/**
 * Minimal-transfer optimizer: settles all players to net zero producing at
 * most (n-1) transfers via greedy largest-debtor→largest-creditor matching.
 */
export function optimizeTransfers(
  net: Record<string, number>,
  players: Player[]
): SettlementInstruction[] {
  const names = Object.fromEntries(players.map((p) => [p.id, p.nickname]));
  const creditors = players
    .map((p) => ({ id: p.id, bal: net[p.id] ?? 0 }))
    .filter((x) => x.bal > 1e-9)
    .sort((a, b) => b.bal - a.bal);
  const debtors = players
    .map((p) => ({ id: p.id, bal: net[p.id] ?? 0 }))
    .filter((x) => x.bal < -1e-9)
    .sort((a, b) => a.bal - b.bal);

  const result: SettlementInstruction[] = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci];
    const d = debtors[di];
    const amt = Math.min(c.bal, -d.bal);
    if (amt > 1e-9) {
      result.push({
        fromPlayerId: d.id,
        fromName: names[d.id] ?? d.id,
        toPlayerId: c.id,
        toName: names[c.id] ?? c.id,
        amount: Math.round(amt * 100) / 100,
      });
      c.bal -= amt;
      d.bal += amt;
    }
    if (Math.abs(c.bal) < 1e-9) ci++;
    if (Math.abs(d.bal) < 1e-9) di++;
  }
  return result;
}

/** money value of a single potted ball event */
export function potMoney(
  ball: BallColor,
  mode: GameMode,
  moneyPer: MoneyRateUnit,
  moneyRate: number
): number {
  if (moneyPer === "ball") return moneyRate;
  return ballValue(ball, mode) * moneyRate;
}