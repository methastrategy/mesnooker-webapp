import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../gameStore";
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
});
