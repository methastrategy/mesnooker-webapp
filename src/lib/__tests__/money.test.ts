import { describe, it, expect } from "vitest";
import { computeFrameMoney, potMoney, optimizeTransfers } from "../money";
import type { Player } from "@/types";

describe("Snooker Money Engine", () => {
  const pA: Player = { id: "pA", nickname: "Player A", color: "red" };
  const pB: Player = { id: "pB", nickname: "Player B", color: "yellow" };
  const pC: Player = { id: "pC", nickname: "Player C", color: "green" };
  const pD: Player = { id: "pD", nickname: "Player D", color: "brown" };

  it("calculates Point Count mode frame money correctly with zero-sum invariant", () => {
    const players = [pA, pB, pC];
    // A eats C, B eats A, C eats B
    const targetCycle = { pA: "pC", pB: "pA", pC: "pB" };
    const scores = { pA: 30, pB: 15, pC: 40 };

    const result = computeFrameMoney({
      mode: "points",
      players,
      scores,
      targetCycle,
      moneyPer: "point",
      moneyRate: 10,
    });

    // A earns 300 from C, pays 150 to B => Net A = +150
    // B earns 150 from A, pays 400 to C => Net B = -250
    // C earns 400 from B, pays 300 to A => Net C = +100
    expect(result.net.pA).toBe(150);
    expect(result.net.pB).toBe(-250);
    expect(result.net.pC).toBe(100);

    // Zero-sum verification
    const sum = Object.values(result.net).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum)).toBeLessThan(1e-6);
  });

  it("calculates Ball Count mode frame money including fouls and brown/black double points", () => {
    const players = [pA, pB, pC];
    const targetCycle = { pA: "pC", pB: "pA", pC: "pB" };
    // In Thai ball count: red=1, brown=2, black=2, foul=-2
    // A scores 6 balls (e.g. 2 reds, 1 brown, 1 black)
    // B scores -4 balls (2 fouls)
    // C scores 2 balls
    const scores = { pA: 6, pB: -4, pC: 2 };

    const result = computeFrameMoney({
      mode: "balls",
      players,
      scores,
      targetCycle,
      moneyPer: "ball",
      moneyRate: 20, // 20 THB per ball
    });

    // value A = +120
    // value B = -80 (fouls cost money!)
    // value C = +40
    // A earns 120 from C, pays -80 to B => Net A = 120 - (-80) = 200
    // B earns -80 from A, pays 40 to C => Net B = -80 - 40 = -120
    // C earns 40 from B, pays 120 to A => Net C = 40 - 120 = -80
    expect(result.net.pA).toBe(200);
    expect(result.net.pB).toBe(-120);
    expect(result.net.pC).toBe(-80);

    const sum = Object.values(result.net).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum)).toBeLessThan(1e-6);
  });

  it("calculates 4 players money flow and verifies minimal transfer settlement", () => {
    const players = [pA, pB, pC, pD];
    // A eats D, B eats A, C eats B, D eats C
    const targetCycle = { pA: "pD", pB: "pA", pC: "pB", pD: "pC" };
    const scores = { pA: 20, pB: 10, pC: -8, pD: 35 };

    const result = computeFrameMoney({
      mode: "points",
      players,
      scores,
      targetCycle,
      moneyPer: "point",
      moneyRate: 10,
    });

    expect(result.net.pA).toBe(100);
    expect(result.net.pB).toBe(180);
    expect(result.net.pC).toBe(-430);
    expect(result.net.pD).toBe(150);

    const transfers = optimizeTransfers(result.net, players);
    // At most n - 1 = 3 transfers
    expect(transfers.length).toBeLessThanOrEqual(3);

    // Sum of amounts transferred equals total positive balances (100 + 180 + 150 = 430)
    const totalTransferred = transfers.reduce((acc, t) => acc + t.amount, 0);
    expect(totalTransferred).toBe(430);
  });

  it("evaluates potMoney correctly for colours in both modes", () => {
    // Points mode: Brown=4, Black=7, Red=1
    expect(potMoney("red", "points", "point", 10)).toBe(10);
    expect(potMoney("brown", "points", "point", 10)).toBe(40);
    expect(potMoney("black", "points", "point", 10)).toBe(70);

    // Balls mode: Brown=2 balls, Black=2 balls, Red=1 ball
    expect(potMoney("red", "balls", "ball", 20)).toBe(20);
    expect(potMoney("yellow", "balls", "ball", 20)).toBe(20);
    expect(potMoney("brown", "balls", "ball", 20)).toBe(40);
    expect(potMoney("black", "balls", "ball", 20)).toBe(40);
  });

  it("calculates moneyPer === ball using ballCounts.total or potted balls correctly", () => {
    const players = [pA, pB];
    const targetCycle = { pA: "pB", pB: "pA" };
    const scores = { pA: 0, pB: 0 }; // scores ignored when ballCounts given

    // Case 1: ballCounts with total property
    const res1 = computeFrameMoney({
      mode: "balls",
      players,
      scores,
      ballCounts: {
        pA: { total: 5 },
        pB: { total: 2 },
      },
      targetCycle,
      moneyPer: "ball",
      moneyRate: 10,
    });
    // pA earns 5*10=50 from pB, pays 2*10=20 to pB => Net pA = +30, Net pB = -30
    expect(res1.net.pA).toBe(30);
    expect(res1.net.pB).toBe(-30);

    // Case 2: ballCounts with BallCounts colors
    const res2 = computeFrameMoney({
      mode: "balls",
      players,
      scores,
      ballCounts: {
        pA: { red: 3, yellow: 1, green: 0, brown: 0, blue: 0, pink: 0, black: 1 },
        pB: { red: 1, yellow: 0, green: 0, brown: 0, blue: 0, pink: 0, black: 0 },
      },
      targetCycle,
      moneyPer: "ball",
      moneyRate: 10,
    });
    // pA potted 5 balls => earns 50, pB potted 1 ball => earns 10 => Net pA = +40, Net pB = -40
    expect(res2.net.pA).toBe(40);
    expect(res2.net.pB).toBe(-40);

    // Case 3: ballCounts overrides points scores when moneyPer === "ball"
    const res3 = computeFrameMoney({
      mode: "balls",
      players,
      scores: { pA: 100, pB: 50 }, // point scores overridden by ballCounts
      ballCounts: {
        pA: { total: 0 },
        pB: { total: 0 },
      },
      targetCycle,
      moneyPer: "ball",
      moneyRate: 10,
    });
    expect(res3.net.pA).toBe(0);
    expect(res3.net.pB).toBe(0);
  });
});
