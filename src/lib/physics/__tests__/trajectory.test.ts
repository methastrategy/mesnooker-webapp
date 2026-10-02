import { describe, expect, it } from "vitest";
import { computeTrajectoryPreview } from "../trajectory";
import { PHYSICS_CONSTANTS } from "../types";

describe("computeTrajectoryPreview", () => {
  const R = PHYSICS_CONSTANTS.BALL_R;

  it("calculates direct hit ghost ball position at distance 2R from target", () => {
    const cuePos = { x: 300, y: 300 };
    const blackPos = { x: 600, y: 300 };
    const balls = [
      { id: "cue", color: "cue", pos: cuePos },
      { id: "black", color: "black", pos: blackPos },
    ];

    const preview = computeTrajectoryPreview(
      cuePos,
      0, // straight along +X
      60,
      { side: 0, vertical: 0 },
      balls,
      "black"
    );

    expect(preview.firstHitBall?.color).toBe("black");
    expect(preview.isTargetHit).toBe(true);
    expect(preview.ghostBall).not.toBeNull();
    // Ghost ball center should be exactly at black.pos.x - 2R
    expect(preview.ghostBall!.x).toBeCloseTo(blackPos.x - 2 * R, 1);
    expect(preview.ghostBall!.y).toBeCloseTo(blackPos.y, 1);
    expect(preview.cutAngleDeg).toBe(0);
    expect(preview.thicknessLabel).toContain("Full Ball");
  });

  it("handles cushion bounce and English spin deflection", () => {
    const cuePos = { x: 400, y: 500 };
    const balls = [{ id: "cue", color: "cue", pos: cuePos }];

    // Shoot toward top cushion at 45 degrees
    const previewNoEnglish = computeTrajectoryPreview(
      cuePos,
      45,
      50,
      { side: 0, vertical: 0 },
      balls
    );

    expect(previewNoEnglish.cushionBounces.length).toBeGreaterThanOrEqual(1);
    expect(previewNoEnglish.cushionBounces[0].side).toBe("t");

    // With right side spin (running english)
    const previewRunningEnglish = computeTrajectoryPreview(
      cuePos,
      45,
      50,
      { side: 0.8, vertical: 0 },
      balls
    );

    expect(previewRunningEnglish.cushionBounces.length).toBeGreaterThanOrEqual(1);
    // Path should extend beyond the first bounce
    expect(previewRunningEnglish.aimPolyline.length).toBeGreaterThan(2);
  });

  it("identifies blocker ball when obstructing target line", () => {
    const cuePos = { x: 300, y: 300 };
    const redBlockerPos = { x: 450, y: 300 };
    const blackPos = { x: 700, y: 300 };

    const balls = [
      { id: "cue", color: "cue", pos: cuePos },
      { id: "red", color: "red", pos: redBlockerPos },
      { id: "black", color: "black", pos: blackPos },
    ];

    const preview = computeTrajectoryPreview(
      cuePos,
      0, // aiming straight toward black
      50,
      { side: 0, vertical: 0 },
      balls,
      "black"
    );

    // Struck red blocker instead of black target
    expect(preview.firstHitBall?.color).toBe("red");
    expect(preview.isTargetHit).toBe(false);
    expect(preview.ghostBall!.x).toBeCloseTo(redBlockerPos.x - 2 * R, 1);
  });
});
