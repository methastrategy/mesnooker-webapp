import { describe, it, expect } from "vitest";
import { buildTargetCycle } from "../rules";
import { computeFrameMoney } from "../money";
import type { Player } from "@/types";

describe("4-Player Target Cycle & Snooker Payment Flow", () => {
  const p1: Player = { id: "p1", nickname: "เม", color: "red" };
  const p2: Player = { id: "p2", nickname: "อุ้ม", color: "yellow" };
  const p3: Player = { id: "p3", nickname: "ฟุค", color: "green" };
  const p4: Player = { id: "p4", nickname: "นน", color: "brown" };
  const players = [p1, p2, p3, p4];

  it("builds correct target cycle for 4 players matching Thai snooker rule", () => {
    const cycleIndices = buildTargetCycle(4);
    // index 0 -> target index 3 (p1 scores against p4)
    // index 1 -> target index 0 (p2 scores against p1)
    // index 2 -> target index 1 (p3 scores against p2)
    // index 3 -> target index 2 (p4 scores against p3)
    expect(cycleIndices).toEqual([3, 0, 1, 2]);

    const targetCycle: Record<string, string> = {};
    players.forEach((p, i) => {
      targetCycle[p.id] = players[cycleIndices[i]].id;
    });

    expect(targetCycle).toEqual({
      p1: "p4", // เม scores on นน (นน pays เม)
      p2: "p1", // อุ้ม scores on เม (เม pays อุ้ม)
      p3: "p2", // ฟุค scores on อุ้ม (อุ้ม pays ฟุค)
      p4: "p3", // นน scores on ฟุค (ฟุค pays นน)
    });
  });

  it("proves payment direction: p1 pays p2 pays p3 pays p4 pays p1", () => {
    const cycleIndices = buildTargetCycle(4);
    const targetCycle: Record<string, string> = {};
    players.forEach((p, i) => {
      targetCycle[p.id] = players[cycleIndices[i]].id;
    });

    // Case: each player gets 2 balls in Ball Count mode (rate 20 THB)
    const result = computeFrameMoney({
      mode: "balls",
      players,
      scores: { p1: 2, p2: 0, p3: 0, p4: 0 },
      targetCycle,
      moneyPer: "ball",
      moneyRate: 20,
    });

    // When p1 (เม) scores:
    // target is p4 (นน). So p4 pays p1 40 THB!
    expect(result.net.p1).toBe(40);
    expect(result.net.p4).toBe(-40);
    expect(result.net.p2).toBe(0);
    expect(result.net.p3).toBe(0);
    expect(result.flows).toEqual([{ fromId: "p4", toId: "p1", amount: 40 }]);

    // When p2 (อุ้ม) scores:
    const result2 = computeFrameMoney({
      mode: "balls",
      players,
      scores: { p1: 0, p2: 2, p3: 0, p4: 0 },
      targetCycle,
      moneyPer: "ball",
      moneyRate: 20,
    });
    // target is p1 (เม). So p1 pays p2 40 THB!
    expect(result2.net.p2).toBe(40);
    expect(result2.net.p1).toBe(-40);
    expect(result2.flows).toEqual([{ fromId: "p1", toId: "p2", amount: 40 }]);
  });

  it("handles complex 4-player frame with fouls and ensures zero-sum table balance", () => {
    const cycleIndices = buildTargetCycle(4);
    const targetCycle: Record<string, string> = {};
    players.forEach((p, i) => {
      targetCycle[p.id] = players[cycleIndices[i]].id;
    });

    // เม (p1): 5 balls
    // อุ้ม (p2): 1 foul (-2 balls)
    // ฟุค (p3): 3 balls (including 1 black ball = 2 pts)
    // นน (p4): 1 miss (-1 ball)
    const scores = { p1: 5, p2: -2, p3: 3, p4: -1 };
    const rate = 15;

    const result = computeFrameMoney({
      mode: "balls",
      players,
      scores,
      targetCycle,
      moneyPer: "ball",
      moneyRate: rate,
    });

    // Total table net balance must equal 0
    const sum = Object.values(result.net).reduce((acc, v) => acc + v, 0);
    expect(Math.abs(sum)).toBeLessThan(1e-6);

    // p1 earns 5*15=75 from p4; p2 has -2*15=-30 towards p1 (p1 pays p2 negative, i.e. p2 pays p1 30)
    // Net p1 = 75 - (-30) = 105
    expect(result.net.p1).toBe(105);
  });

  it("handles 2-player head-to-head reciprocal target cycle", () => {
    const twoPlayers = [p1, p2];
    const cycleIndices = buildTargetCycle(2);
    expect(cycleIndices).toEqual([1, 0]);

    const targetCycle: Record<string, string> = {
      p1: "p2", // p1 targets p2
      p2: "p1", // p2 targets p1
    };

    const res = computeFrameMoney({
      mode: "balls",
      players: twoPlayers,
      scores: { p1: 4, p2: 1 },
      targetCycle,
      moneyPer: "ball",
      moneyRate: 20,
    });

    // p1 scored 4 -> p2 pays p1 80
    // p2 scored 1 -> p1 pays p2 20
    // Net: p1 = +60, p2 = -60
    expect(res.net.p1).toBe(60);
    expect(res.net.p2).toBe(-60);
    expect(res.net.p1 + res.net.p2).toBe(0);
  });

  it("handles 3-player triangle target cycle", () => {
    const threePlayers = [p1, p2, p3];
    const cycleIndices = buildTargetCycle(3);
    // 0->2, 1->0, 2->1
    expect(cycleIndices).toEqual([2, 0, 1]);

    const targetCycle: Record<string, string> = {
      p1: "p3", // p1 targets p3 (p3 pays p1)
      p2: "p1", // p2 targets p1 (p1 pays p2)
      p3: "p2", // p3 targets p2 (p2 pays p3)
    };

    const res = computeFrameMoney({
      mode: "points",
      players: threePlayers,
      scores: { p1: 10, p2: 20, p3: 30 },
      targetCycle,
      moneyPer: "point",
      moneyRate: 1,
    });

    // p1 scores 10 -> p3 pays p1 10
    // p2 scores 20 -> p1 pays p2 20
    // p3 scores 30 -> p2 pays p3 30
    // Net p1: +10 (from p3) - 20 (to p2) = -10
    // Net p2: +20 (from p1) - 30 (to p3) = -10
    // Net p3: +30 (from p2) - 10 (to p1) = +20
    expect(res.net.p1).toBe(-10);
    expect(res.net.p2).toBe(-10);
    expect(res.net.p3).toBe(20);
    expect(res.net.p1 + res.net.p2 + res.net.p3).toBe(0);
  });
});

