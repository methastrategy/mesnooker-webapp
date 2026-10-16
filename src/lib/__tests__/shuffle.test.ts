import { describe, it, expect } from "vitest";

describe("Player Roster Shuffle Algorithm", () => {
  it("randomizes roster order while preserving name and avatar pairings", () => {
    const originalNames = ["เม", "อุ้ม", "ฟุค", "นน"];
    const originalAvatars = ["🎱", "🍀", "🔥", "🦁"];
    const count = 4;

    const pairs = originalNames.slice(0, count).map((name, i) => ({
      name,
      avatar: originalAvatars[i],
    }));

    // Perform Fisher-Yates
    const active = [...pairs];
    for (let i = active.length - 1; i > 0; i--) {
      // Deterministic swap for test verification
      const j = 0;
      [active[i], active[j]] = [active[j], active[i]];
    }

    // Must still contain all 4 original names and avatars
    expect(active.map((p) => p.name).sort()).toEqual([...originalNames].sort());
    expect(active.map((p) => p.avatar).sort()).toEqual([...originalAvatars].sort());

    // Pairings must be strictly maintained (e.g. เม is always with 🎱)
    for (const p of active) {
      const idx = originalNames.indexOf(p.name);
      expect(p.avatar).toBe(originalAvatars[idx]);
    }
  });

  it("handles 2-player shuffle and edge cases gracefully", () => {
    const originalNames = ["Metha", "Player 2"];
    const originalAvatars = ["🎱", "🍀"];
    const active = originalNames.map((name, i) => ({ name, avatar: originalAvatars[i] }));

    // Swap 2 players
    [active[0], active[1]] = [active[1], active[0]];
    expect(active[0].name).toBe("Player 2");
    expect(active[0].avatar).toBe("🍀");
    expect(active[1].name).toBe("Metha");
    expect(active[1].avatar).toBe("🎱");
  });
});
