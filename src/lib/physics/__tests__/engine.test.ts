import { describe, expect, it } from "vitest";
import { SnookerPhysicsEngine } from "../engine";
import { PHYSICS_CONSTANTS } from "../types";

describe("SnookerPhysicsEngine", () => {
  it("initializes balls with correct rest states", () => {
    const engine = new SnookerPhysicsEngine([
      { id: "cue", color: "cue", pos: { x: 330, y: 300 } },
      { id: "black", color: "black", pos: { x: 1100, y: 300 } },
    ]);

    const balls = engine.getBalls();
    expect(balls.length).toBe(2);
    expect(balls[0].vel).toEqual({ x: 0, y: 0 });
    expect(balls[0].isRolling).toBe(true);
    expect(balls[0].isPotted).toBe(false);
  });

  it("strikes cue ball with velocity and spin", () => {
    const engine = new SnookerPhysicsEngine([
      { id: "cue", color: "cue", pos: { x: 330, y: 300 } },
    ]);

    // Strike along +X (0 deg) with 50% power, high topspin (+0.8), right spin (+0.5)
    engine.strikeCue({
      angleDeg: 0,
      power: 50,
      spin: { side: 0.5, vertical: 0.8 },
    });

    const cue = engine.getBall("cue")!;
    expect(cue.vel.x).toBeGreaterThan(500);
    expect(cue.vel.y).toBeCloseTo(0, 1);
    expect(cue.isRolling).toBe(false); // starts in sliding phase
    expect(cue.omega.z).toBeGreaterThan(0); // right spin -> counter-clockwise (positive omega_z)
    expect(cue.omega.y).toBeGreaterThan(0); // forward spin along +X
  });

  it("transitions from sliding to pure rolling due to cloth friction", () => {
    const engine = new SnookerPhysicsEngine([
      { id: "cue", color: "cue", pos: { x: 200, y: 300 } },
    ]);

    // Strike with backspin (screw/draw: vertical = -0.8)
    engine.strikeCue({
      angleDeg: 0,
      power: 30,
      spin: { side: 0, vertical: -0.8 },
    });

    // Simulate for several frames
    for (let i = 0; i < 60; i++) {
      engine.update(1 / 60);
    }

    const cue = engine.getBall("cue")!;
    // After sufficient travel time, cloth friction must establish pure rolling
    expect(cue.isRolling).toBe(true);
    const R = PHYSICS_CONSTANTS.BALL_R;
    // In pure rolling, omega_y == vx / R
    expect(cue.omega.y).toBeCloseTo(cue.vel.x / R, 1);
  });

  it("exhibits cloth nap asymmetry (with nap vs against nap)", () => {
    // Engine 1: rolling with nap (+X)
    const engineWith = new SnookerPhysicsEngine([
      { id: "cue", color: "cue", pos: { x: 200, y: 300 } },
    ]);
    engineWith.strikeCue({
      angleDeg: 0, // +X
      power: 40,
      spin: { side: 0, vertical: 0 },
    });

    // Engine 2: rolling against nap (-X)
    const engineAgainst = new SnookerPhysicsEngine([
      { id: "cue", color: "cue", pos: { x: 1000, y: 300 } },
    ]);
    engineAgainst.strikeCue({
      angleDeg: 180, // -X
      power: 40,
      spin: { side: 0, vertical: 0 },
    });

    // Simulate for 1.0 second
    for (let i = 0; i < 60; i++) {
      engineWith.update(1 / 60);
      engineAgainst.update(1 / 60);
    }

    const distWith = engineWith.getBall("cue")!.pos.x - 200;
    const distAgainst = 1000 - engineAgainst.getBall("cue")!.pos.x;

    // Rolling with nap has less resistance and thus travels further
    expect(distWith).toBeGreaterThan(distAgainst);
  });

  it("bounces cleanly off cushions with restitution and torque", () => {
    const engine = new SnookerPhysicsEngine([
      { id: "cue", color: "cue", pos: { x: 400, y: 520 } },
    ]);

    // Shoot directly up toward top cushion rail (y = 600 - R = 576)
    engine.strikeCue({
      angleDeg: 90,
      power: 40,
      spin: { side: 0, vertical: 0 },
    });

    // Update until cushion bounce occurs
    for (let i = 0; i < 40; i++) {
      engine.update(1 / 60);
    }

    expect(engine.cushionEvents.length).toBeGreaterThanOrEqual(1);
    expect(engine.cushionEvents[0].side).toBe("t");
    const cue = engine.getBall("cue")!;
    // Rebounded downwards: vel.y < 0
    expect(cue.vel.y).toBeLessThan(0);
    // Cushion height above ball center imparts forward rolling torque for rebound
    expect(cue.omega.x).toBeGreaterThan(0);
  });

  it("simulates ball-to-ball impact with momentum transfer and evaluates clean hit", () => {
    const engine = new SnookerPhysicsEngine([
      { id: "cue", color: "cue", pos: { x: 300, y: 300 } },
      { id: "black", color: "black", pos: { x: 500, y: 300 } },
    ]);

    // Direct shot into black ball
    engine.strikeCue({
      angleDeg: 0,
      power: 50,
      spin: { side: 0, vertical: 0 },
    });

    const outcome = engine.simulateToRest(3.0);

    expect(engine.collisionEvents.length).toBeGreaterThanOrEqual(1);
    const black = engine.getBall("black")!;
    // Black ball received momentum and moved forward
    expect(black.pos.x).toBeGreaterThan(500);

    // Escape hit evaluation
    expect(outcome.success).toBe(true);
    expect(outcome.firstHitColor).toBe("black");
    expect(outcome.foul).toBe(false);
  });

  it("detects foul when blocker ball is hit before target ball", () => {
    const engine = new SnookerPhysicsEngine([
      { id: "cue", color: "cue", pos: { x: 300, y: 300 } },
      { id: "red-blocker", color: "red", pos: { x: 450, y: 300 } },
      { id: "black", color: "black", pos: { x: 600, y: 300 } },
    ]);

    // Shot aimed directly ahead into the red blocker
    engine.strikeCue({
      angleDeg: 0,
      power: 40,
      spin: { side: 0, vertical: 0 },
    });

    const outcome = engine.simulateToRest(3.0);

    expect(outcome.success).toBe(false);
    expect(outcome.foul).toBe(true);
    expect(outcome.firstHitColor).toBe("red");
    expect(outcome.foulReason).toContain("Foul: Struck RED");
  });

  it("detects foul when cue ball is potted (scratch / in-off)", () => {
    const engine = new SnookerPhysicsEngine([
      { id: "cue", color: "cue", pos: { x: 100, y: 100 } },
    ]);

    // Shoot directly into Bottom-Left pocket (0, 0)
    engine.strikeCue({
      angleDeg: 225, // toward bottom-left
      power: 50,
      spin: { side: 0, vertical: 0 },
    });

    const outcome = engine.simulateToRest(2.0);

    expect(outcome.cuePotted).toBe(true);
    expect(outcome.foul).toBe(true);
    expect(outcome.foulReason).toContain("In-off Foul");
  });

  it("transfers spin to the target ball and applies spin-induced throw during collision", () => {
    const engine = new SnookerPhysicsEngine([
      { id: "cue", color: "cue", pos: { x: 300, y: 300 } },
      { id: "black", color: "black", pos: { x: 400, y: 300 } },
    ]);

    // Strike with extreme right sidespin (counter-clockwise omega_z on cue ball)
    engine.strikeCue({
      angleDeg: 0,
      power: 60,
      spin: { side: 1.0, vertical: 0 },
    });

    // Run until collision occurs
    for (let i = 0; i < 20; i++) {
      engine.update(1 / 120);
    }

    const black = engine.getBall("black")!;
    const cue = engine.getBall("cue")!;
    // Target ball should receive opposite transferred spin (clockwise < 0)
    expect(black.omega.z).toBeLessThan(0);
    // Right english throws target ball to the LEFT (positive Y direction along +X aim)
    expect(black.vel.y).toBeGreaterThan(0);
    // Cue ball deflects to the RIGHT (negative Y direction)
    expect(cue.vel.y).toBeLessThan(0);
  });

  it("correctly registers target ball potted", () => {
    const engine = new SnookerPhysicsEngine([
      { id: "cue", color: "cue", pos: { x: 1050, y: 100 } },
      { id: "black", color: "black", pos: { x: 1140, y: 40 } },
    ]);

    // Shoot black ball into Bottom-Right pocket (1200, 0)
    const angleToBlack = (Math.atan2(40 - 100, 1140 - 1050) * 180) / Math.PI;
    engine.strikeCue({
      angleDeg: angleToBlack,
      power: 60,
      spin: { side: 0, vertical: 0 },
    });

    const outcome = engine.simulateToRest(4.0);

    expect(outcome.targetPotted).toBe(true);
    expect(outcome.pottedBallIds).toContain("black");
  });

  it("verifies running english widens cushion rebound angle compared to check english", () => {
    // Shoot up-right towards top rail at 45 degrees
    // Running English is Right English (+1.0 side)
    const engineRun = new SnookerPhysicsEngine([
      { id: "cue", color: "cue", pos: { x: 400, y: 450 } },
    ]);
    engineRun.strikeCue({
      angleDeg: 45,
      power: 50,
      spin: { side: 1.0, vertical: 0 },
    });
    for (let i = 0; i < 40; i++) engineRun.update(1 / 120);

    // Check English is Left English (-1.0 side)
    const engineChk = new SnookerPhysicsEngine([
      { id: "cue", color: "cue", pos: { x: 400, y: 450 } },
    ]);
    engineChk.strikeCue({
      angleDeg: 45,
      power: 50,
      spin: { side: -1.0, vertical: 0 },
    });
    for (let i = 0; i < 40; i++) engineChk.update(1 / 120);

    expect(engineRun.cushionEvents.length).toBeGreaterThanOrEqual(1);
    expect(engineChk.cushionEvents.length).toBeGreaterThanOrEqual(1);

    const cueRun = engineRun.getBall("cue")!;
    const cueChk = engineChk.getBall("cue")!;

    // Running English maintains higher tangential velocity along +X rail
    expect(cueRun.vel.x).toBeGreaterThan(cueChk.vel.x);
  });

  it("verifies cushion height torque immediately aligns angular velocity with rail tangent without sideways drift", () => {
    const engine = new SnookerPhysicsEngine([
      { id: "cue", color: "cue", pos: { x: 500, y: 550 } },
    ]);
    // Shoot straight up at top cushion (normal n = [0, -1], tangent t = [1, 0])
    engine.strikeCue({
      angleDeg: 90,
      power: 30,
      spin: { side: 0, vertical: 0 },
    });

    // Step until the exact sub-step where cushion hit occurs
    while (engine.cushionEvents.length === 0) {
      engine.update(1 / 240);
    }

    const cue = engine.getBall("cue")!;
    // Immediately after bounce: forward roll for downward rebound means omega.x > 0
    expect(cue.omega.x).toBeGreaterThan(0);
    // Rail tangent has ty = 0, so there must be no sideways torque around Y axis!
    expect(Math.abs(cue.omega.y)).toBeLessThan(0.05);
  });

  it("pots a ball entering pocket mouth without boundary teleportation", () => {
    // Position ball near bottom-left pocket moving toward the pocket opening
    const engine = new SnookerPhysicsEngine([
      { id: "cue", color: "cue", pos: { x: 30, y: 20 } },
    ]);
    engine.strikeCue({
      angleDeg: 215, // heading directly into pocket jaws
      power: 40,
      spin: { side: 0, vertical: 0 },
    });

    const outcome = engine.simulateToRest(2.0);
    expect(outcome.cuePotted).toBe(true);
    const cue = engine.getBall("cue")!;
    expect(cue.isPotted).toBe(true);
  });
});
