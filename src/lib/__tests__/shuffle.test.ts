import { describe, it, expect } from "vitest";
import { shuffleRoster } from "../roster";

describe("Player Roster Shuffle Algorithm (shuffleRoster)", () => {
  it("randomizes roster order while strictly preserving name and avatar pairings", () => {
    const originalNames = ["เม", "อุ้ม", "ฟุค", "นน"];
    const originalAvatars = ["🎱", "🍀", "🔥", "🦁"];
    const count = 4;

    const result = shuffleRoster(originalNames, originalAvatars, count);

    // Array lengths must match
    expect(result.names).toHaveLength(originalNames.length);
    expect(result.avatars).toHaveLength(originalAvatars.length);

    // Elements must be a permutation of the original inputs
    expect([...result.names].sort()).toEqual([...originalNames].sort());
    expect([...result.avatars].sort()).toEqual([...originalAvatars].sort());

    // Pairings must be strictly maintained (e.g. เม is always paired with 🎱)
    for (let i = 0; i < count; i++) {
      const name = result.names[i];
      const avatar = result.avatars[i];
      const originalIdx = originalNames.indexOf(name);
      expect(avatar).toBe(originalAvatars[originalIdx]);
    }
  });

  it("guarantees an active swap for 2-player setup", () => {
    const originalNames = ["เม", "อุ้ม"];
    const originalAvatars = ["🎱", "🍀"];

    const result = shuffleRoster(originalNames, originalAvatars, 2);

    expect(result.names).toEqual(["อุ้ม", "เม"]);
    expect(result.avatars).toEqual(["🍀", "🎱"]);
  });

  it("handles count < 2 gracefully without mutating inputs", () => {
    const names = ["Solo"];
    const avatars = ["🎱"];

    const r0 = shuffleRoster(names, avatars, 0);
    expect(r0.names).toEqual(names);
    expect(r0.avatars).toEqual(avatars);

    const r1 = shuffleRoster(names, avatars, 1);
    expect(r1.names).toEqual(names);
    expect(r1.avatars).toEqual(avatars);
  });

  it("preserves inactive entries beyond count untouched", () => {
    const names = ["P1", "P2", "P3", "P4", "P5_inactive", "P6_inactive"];
    const avatars = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"];
    const count = 4;

    const result = shuffleRoster(names, avatars, count);

    // Active slice [0..3] is permuted
    expect([...result.names.slice(0, 4)].sort()).toEqual(["P1", "P2", "P3", "P4"]);
    // Inactive entries [4..5] remain in their exact positions
    expect(result.names[4]).toBe("P5_inactive");
    expect(result.names[5]).toBe("P6_inactive");
    expect(result.avatars[4]).toBe("5️⃣");
    expect(result.avatars[5]).toBe("6️⃣");
  });

  it("uses custom deterministic rng when provided", () => {
    const names = ["A", "B", "C"];
    const avatars = ["🍎", "🍌", "🍒"];
    // Deterministic sequence: j = 0 for all steps
    const rng = () => 0;

    const result = shuffleRoster(names, avatars, 3, rng);
    expect(result.names).toEqual(["B", "C", "A"]);
    expect(result.avatars).toEqual(["🍌", "🍒", "🍎"]);
  });
});
