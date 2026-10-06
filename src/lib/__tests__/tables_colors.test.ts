import { describe, it, expect } from "vitest";
import { BALL_COLORS, CUE_COLOR } from "../geometry/tables";
import { BALL_HEX, BALL_ORDER } from "../rules";

describe("geometry tables ball color unification", () => {
  it("includes cue ball color and matches BALL_HEX for all standard snooker balls", () => {
    expect(BALL_COLORS.cue).toBe(CUE_COLOR);

    for (const ball of BALL_ORDER) {
      expect(BALL_COLORS[ball]).toBe(BALL_HEX[ball]);
    }
  });
});
