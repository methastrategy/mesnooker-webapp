import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../gameStore";
import { inferBreakPhase, BreakPhase } from "@/lib/rules";
import type { Player } from "@/types";

const memoryStorage = new Map<string, string>();
if (typeof globalThis.localStorage === "undefined") {
  globalThis.localStorage = {
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryStorage.set(key, value);
    },
    removeItem: (key: string) => {
      memoryStorage.delete(key);
    },
    clear: () => {
      memoryStorage.clear();
    },
    key: (index: number) => Array.from(memoryStorage.keys())[index] ?? null,
    get length() {
      return memoryStorage.size;
    },
  };
}

describe("gameStore - paidTransfers persistence and state", () => {
  const p1: Player = { id: "p1", nickname: "Alice", color: "red" };
  const p2: Player = { id: "p2", nickname: "Bob", color: "yellow" };

  beforeEach(() => {
    useGameStore.setState({
      paidTransfers: [],
      players: [p1, p2],
      frames: [],
      events: [],
      session: null,
      history: [],
    });
  });

  it("marks a transfer as paid and avoids duplicates", () => {
    const key = "p1->p2";
    useGameStore.getState().markTransferPaid(key);
    expect(useGameStore.getState().paidTransfers).toEqual([key]);

    // idempotent call
    useGameStore.getState().markTransferPaid(key);
    expect(useGameStore.getState().paidTransfers).toEqual([key]);
  });

  it("undoes a payment by key", () => {
    const k1 = "p1->p2";
    const k2 = "p2->p1";
    useGameStore.getState().markTransferPaid(k1);
    useGameStore.getState().markTransferPaid(k2);
    expect(useGameStore.getState().paidTransfers).toContain(k1);
    expect(useGameStore.getState().paidTransfers).toContain(k2);

    useGameStore.getState().undoTransferPayment(k1);
    expect(useGameStore.getState().paidTransfers).toEqual([k2]);
  });

  it("clears paid transfers", () => {
    useGameStore.getState().markTransferPaid("p1->p2");
    useGameStore.getState().clearPaidTransfers();
    expect(useGameStore.getState().paidTransfers).toEqual([]);
  });

  it("resets paidTransfers on startSession", () => {
    useGameStore.getState().markTransferPaid("p1->p2");
    expect(useGameStore.getState().paidTransfers.length).toBe(1);

    useGameStore.getState().startSession({
      players: [p1, p2],
      mode: "points",
      moneyRate: 10,
      moneyPer: "point",
      redCount: 15,
    });

    expect(useGameStore.getState().paidTransfers).toEqual([]);
  });

  it("guards endFrame against double counting into runningBalance", () => {
    useGameStore.getState().startSession({
      players: [p1, p2],
      mode: "points",
      moneyRate: 10,
      moneyPer: "point",
      redCount: 15,
    });

    // Score some points for p1
    useGameStore.getState().pot("red"); // p1 scores 1 point

    // End frame once
    useGameStore.getState().endFrame();
    const balanceOnce = { ...useGameStore.getState().session!.runningBalance };

    // End frame second time (should be guarded by f.endedAt)
    useGameStore.getState().endFrame();
    const balanceTwice = { ...useGameStore.getState().session!.runningBalance };

    expect(balanceTwice).toEqual(balanceOnce);
  });

  it("preserves settlement lifecycle when session is archived and session is null", () => {
    useGameStore.getState().startSession({
      players: [p1, p2],
      mode: "points",
      moneyRate: 10,
      moneyPer: "point",
      redCount: 15,
    });

    useGameStore.getState().pot("red");
    useGameStore.getState().endFrame();

    const archived = useGameStore.getState().archiveAndReset();
    expect(archived).not.toBeNull();
    expect(useGameStore.getState().session).toBeNull();
    expect(useGameStore.getState().history.length).toBe(1);
    expect(useGameStore.getState().history[0].id).toBe(archived!.id);

    // Toggling payment persists even when session === null (settling debt for ended match)
    const transferKey = `${p2.id}->${p1.id}`;
    useGameStore.getState().markTransferPaid(transferKey);
    expect(useGameStore.getState().paidTransfers).toContain(transferKey);

    useGameStore.getState().undoTransferPayment(transferKey);
    expect(useGameStore.getState().paidTransfers).not.toContain(transferKey);
  });

  it("determines frame winner when all players have negative scores (BUG-02 fix)", () => {
    useGameStore.getState().startSession({
      players: [p1, p2],
      mode: "points",
      moneyRate: 10,
      moneyPer: "point",
      redCount: 15,
    });

    // p1 commits 1 foul (-4 pts), p2 commits 2 fouls (-8 pts)
    useGameStore.getState().applyScoring("foul"); // p1 fouls (-4) -> turn advances to p2
    useGameStore.getState().applyScoring("foul"); // p2 fouls (-4) -> turn advances to p1
    useGameStore.getState().endTurn(); // p1 passes -> turn advances to p2
    useGameStore.getState().applyScoring("foul"); // p2 fouls (-8) -> turn advances to p1

    // Current scores: p1 = -4, p2 = -8. All scores negative!
    useGameStore.getState().endFrame();

    const frame = useGameStore.getState().frames[0];
    expect(frame.scores[p1.id]).toBe(-4);
    expect(frame.scores[p2.id]).toBe(-8);
    // p1 has higher score than p2 (-4 > -8) and must be crowned winner!
    expect(frame.winnerId).toBe(p1.id);
  });

  it("calculates highest break accurately per active visit only (BUG-03 fix)", () => {
    useGameStore.getState().startSession({
      players: [p1, p2],
      mode: "points",
      moneyRate: 10,
      moneyPer: "point",
      redCount: 15,
    });

    // Visit 1 for p1: pots Red (1) + Black (7) = 8 break points
    useGameStore.getState().pot("red");
    useGameStore.getState().pot("black");

    let frame = useGameStore.getState().frames[0];
    expect(frame.breaks[p1.id]).toBe(8);
    expect(frame.highestBreak).toBe(8);

    // End turn for p1 -> passes to p2
    useGameStore.getState().endTurn();

    // p2 misses or plays safe -> end turn -> passes back to p1
    useGameStore.getState().endTurn();

    // Visit 2 for p1: pots Red (1) only
    useGameStore.getState().pot("red");

    const events = useGameStore.getState().events;
    const lastEvent = events[events.length - 1];
    // In visit 2, break is only 1 point, NOT 8 + 1 or counting all events!
    expect(lastEvent.breakValue).toBe(1);

    frame = useGameStore.getState().frames[0];
    // Highest break for p1 in this frame remains 8!
    expect(frame.breaks[p1.id]).toBe(8);
    expect(frame.highestBreak).toBe(8);
  });

  it("supports Free Ball nomination without decrementing remaining reds and enables colour shot next", () => {
    useGameStore.getState().startSession({
      players: [p1, p2],
      mode: "points",
      moneyRate: 10,
      moneyPer: "point",
      redCount: 15,
    });

    // Opponent fouls, leaves incoming player snookered -> Referee awards Free Ball
    useGameStore.getState().setFreeBall(true);
    expect(useGameStore.getState().freeBallActive).toBe(true);

    const initialReds = useGameStore.getState().ballCounts.red;
    expect(initialReds).toBe(15);

    // Player nominates and pots Blue as a free ball
    useGameStore.getState().pot("blue");

    // Blue potted as free ball scores +1 point (like a red)
    const frame = useGameStore.getState().frames[0];
    expect(frame.scores[p1.id]).toBe(1);

    // Red ball count on table must NOT be decremented!
    expect(useGameStore.getState().ballCounts.red).toBe(15);
    // freeBallActive resets to false after shot
    expect(useGameStore.getState().freeBallActive).toBe(false);

    // Free ball acted as a red: next shot must transition to BreakPhase.COLOUR!
    const events = useGameStore.getState().events;
    const phase = inferBreakPhase(events, p1.id);
    expect(phase).toBe(BreakPhase.COLOUR);

    // Shooter can now pot a colour (e.g. Pink = 6)
    useGameStore.getState().pot("pink");
    expect(useGameStore.getState().frames[0].scores[p1.id]).toBe(7); // 1 + 6 = 7
  });

  it("supports foul with specific penalty and Play Again option", () => {
    useGameStore.getState().startSession({
      players: [p1, p2],
      mode: "points",
      moneyRate: 10,
      moneyPer: "point",
      redCount: 15,
    });

    // Player 1 commits a foul involving the Pink ball (-6 pts) and p2 elects Play Again
    useGameStore.getState().foulWithOptions({ points: 6, playAgain: true });

    const frame = useGameStore.getState().frames[0];
    expect(frame.scores[p1.id]).toBe(-6);
    // Play Again was elected: shooterIndex remains 0 (p1 shoots again!)
    expect(useGameStore.getState().shooterIndex).toBe(0);

    // Now p1 fouls on black (-7 pts) normally (without Play Again)
    useGameStore.getState().foulWithOptions({ points: 7, playAgain: false });
    expect(frame.scores[p1.id]).toBe(-13);
    // Turn passes to p2
    expect(useGameStore.getState().shooterIndex).toBe(1);
  });

  it("supports standalone playAgain targeting the violator and prevents cycling", () => {
    const p3: Player = { id: "p3", nickname: "Charlie", color: "green" };
    useGameStore.getState().startSession({
      players: [p1, p2, p3],
      mode: "points",
      moneyRate: 10,
      moneyPer: "point",
      redCount: 15,
    });

    // p1 commits a standard foul via applyScoring -> turn auto-advances to p2
    useGameStore.getState().applyScoring("foul");
    expect(useGameStore.getState().shooterIndex).toBe(1); // p2's turn

    // p2 elects playAgain from MoreActionsSheet -> switches back to p1 (who fouled)
    useGameStore.getState().playAgain();
    expect(useGameStore.getState().shooterIndex).toBe(0);

    // Tapping playAgain again while p1 is already shooting must NOT jump to p3!
    useGameStore.getState().playAgain();
    expect(useGameStore.getState().shooterIndex).toBe(0);
  });

  it("supports Re-rack to restart frame at 0-0 without settlement", () => {
    useGameStore.getState().startSession({
      players: [p1, p2],
      mode: "points",
      moneyRate: 10,
      moneyPer: "point",
      redCount: 15,
    });

    useGameStore.getState().pot("red");
    useGameStore.getState().pot("black");
    expect(useGameStore.getState().frames[0].scores[p1.id]).toBe(8);

    // Both players agree to re-rack
    useGameStore.getState().rerack();

    const frame = useGameStore.getState().frames[0];
    expect(frame.scores[p1.id]).toBe(0);
    expect(frame.scores[p2.id]).toBe(0);
    expect(useGameStore.getState().ballCounts.red).toBe(15);
    expect(useGameStore.getState().session!.runningBalance[p1.id]).toBe(0);
  });

  it("supports Concede frame awarding win to leading player with or without explicit ID", () => {
    useGameStore.getState().startSession({
      players: [p1, p2],
      mode: "points",
      moneyRate: 10,
      moneyPer: "point",
      redCount: 15,
    });

    useGameStore.getState().pot("red"); // p1 scores 1
    useGameStore.getState().pot("black"); // p1 scores 7 (total 8)
    useGameStore.getState().endTurn(); // pass to p2 (score 0)

    // Case 1: p2 concedes explicitly
    useGameStore.getState().concede(p2.id);
    let frame = useGameStore.getState().frames[0];
    expect(frame.endedAt).toBeDefined();
    expect(frame.winnerId).toBe(p1.id);

    // Resume frame to test Case 2
    useGameStore.getState().resumeFrame();

    // Case 2: Concede called without arguments from UI while p1 (leader) is shooter
    useGameStore.getState().setShooterManual(0); // p1 is shooter with 8 points
    useGameStore.getState().concede(); // opponent concedes to the leader
    frame = useGameStore.getState().frames[0];
    expect(frame.endedAt).toBeDefined();
    expect(frame.winnerId).toBe(p1.id);
  });

  it("supports Respot Black when tied, and crowns winner on pot or foul", () => {
    useGameStore.getState().startSession({
      players: [p1, p2],
      mode: "points",
      moneyRate: 10,
      moneyPer: "point",
      redCount: 15,
    });

    // Tied frame concluded
    useGameStore.getState().frames[0].scores = { [p1.id]: 20, [p2.id]: 20 };
    useGameStore.getState().endFrame();

    expect(useGameStore.getState().frames[0].endedAt).toBeDefined();
    expect(useGameStore.getState().frames[0].winnerId).toBeUndefined(); // tied

    // Trigger Respot Black
    useGameStore.getState().respotBlack();

    let frame = useGameStore.getState().frames[0];
    expect(frame.endedAt).toBeUndefined();
    expect(useGameStore.getState().ballCounts.black).toBe(1);
    expect(useGameStore.getState().ballCounts.red).toBe(0);

    // p1 pots the respotted black -> auto-ends and crowns p1
    useGameStore.getState().pot("black");
    frame = useGameStore.getState().frames[0];
    expect(frame.endedAt).toBeDefined();
    expect(frame.scores[p1.id]).toBe(27);
    expect(frame.winnerId).toBe(p1.id);
  });

  it("auto-ends on black when snooker miss is committed on the final black", () => {
    useGameStore.getState().startSession({
      players: [p1, p2],
      mode: "points",
      moneyRate: 10,
      moneyPer: "point",
      redCount: 0,
    });

    // Leave only black ball
    useGameStore.getState().ballCounts = {
      red: 0, yellow: 0, green: 0, brown: 0, blue: 0, pink: 0, black: 1,
    };
    useGameStore.getState().frames[0].scores = { [p1.id]: 10, [p2.id]: 10 };

    // p1 commits a miss on the black ball
    useGameStore.getState().applyScoring("miss");

    const frame = useGameStore.getState().frames[0];
    expect(frame.endedAt).toBeDefined();
    expect(frame.scores[p1.id]).toBe(8); // 10 - 2 = 8
    expect(frame.scores[p2.id]).toBe(10);
    expect(frame.winnerId).toBe(p2.id); // p2 wins!
  });

  it("does not leak highest break across frame boundaries", () => {
    useGameStore.getState().startSession({
      players: [p1, p2],
      mode: "points",
      moneyRate: 10,
      moneyPer: "point",
      redCount: 15,
    });

    // Frame 1: p1 pots red (1) + black (7) = 8
    useGameStore.getState().pot("red");
    useGameStore.getState().pot("black");
    useGameStore.getState().endFrame();

    // Start Frame 2
    useGameStore.getState().newFrame();
    expect(useGameStore.getState().frames.length).toBe(2);

    // Frame 2 opener is p2 (rotation rule: p2 opens Frame 2 as index 0)
    const shooter = useGameStore.getState().players[0];
    expect(shooter.id).toBe(p2.id);

    // Frame 2: shooter pots red (1) only
    useGameStore.getState().pot("red");
    const events = useGameStore.getState().events;
    const lastEvent = events[events.length - 1];

    // Frame 2 break must be 1, isolated from Frame 1
    expect(lastEvent.breakValue).toBe(1);
    const frame2 = useGameStore.getState().frames[1];
    expect(frame2.breaks[p2.id]).toBe(1);
    expect(frame2.highestBreak).toBe(1);
  });
});
