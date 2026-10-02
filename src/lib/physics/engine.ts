/**
 * Mesnooker Realistic Physics Engine
 * High-fidelity 240Hz sub-stepping simulation for 12ft Snooker table.
 * Implements:
 *   - Sliding-to-rolling friction transition (u = v + omega x r_c)
 *   - Dynamic cue strike with follow / draw / english
 *   - Cushion restitution with height-induced torque (0.4R) & english deflection
 *   - Ball-to-ball momentum + Cut-Induced Throw (CIT) + Spin Transfer
 *   - Directional cloth nap (Baulk -> Black)
 */

import {
  PHYSICS_CONSTANTS,
  type AimShotConfig,
  type BallCollisionEvent,
  type BallPhysicsState,
  type CushionHitEvent,
  type PotEvent,
  type ShotOutcome,
  type Vec2D,
} from "./types";
import { POCKETS } from "../geometry/tables";

export class SnookerPhysicsEngine {
  private balls: Map<string, BallPhysicsState> = new Map();
  private isSimulating: boolean = false;
  private simulationTime: number = 0;

  // Event histories for outcome evaluation & sound triggers
  public cushionEvents: CushionHitEvent[] = [];
  public collisionEvents: BallCollisionEvent[] = [];
  public potEvents: PotEvent[] = [];

  constructor(initialBalls?: { id: string; color: string; pos: Vec2D }[]) {
    if (initialBalls) {
      this.initBalls(initialBalls);
    }
  }

  /** Initialize or reset balls on the table */
  public initBalls(balls: { id: string; color: string; pos: Vec2D }[]): void {
    this.balls.clear();
    this.cushionEvents = [];
    this.collisionEvents = [];
    this.potEvents = [];
    this.simulationTime = 0;
    this.isSimulating = false;

    for (const b of balls) {
      this.balls.set(b.id, {
        id: b.id,
        color: b.color,
        pos: { ...b.pos },
        vel: { x: 0, y: 0 },
        omega: { x: 0, y: 0, z: 0 },
        isRolling: true,
        isPotted: false,
      });
    }
  }

  public getBalls(): BallPhysicsState[] {
    return Array.from(this.balls.values()).map((b) => ({
      ...b,
      pos: { ...b.pos },
      vel: { ...b.vel },
      omega: { ...b.omega },
    }));
  }

  public getBall(id: string): BallPhysicsState | undefined {
    const b = this.balls.get(id);
    if (!b) return undefined;
    return {
      ...b,
      pos: { ...b.pos },
      vel: { ...b.vel },
      omega: { ...b.omega },
    };
  }

  public isRunning(): boolean {
    return this.isSimulating;
  }

  /**
   * Strike the cue ball according to angle, power, and spin.
   */
  public strikeCue(config: AimShotConfig, cueId: string = "cue"): boolean {
    const cue = this.balls.get(cueId) ?? Array.from(this.balls.values()).find((b) => b.color === "cue");
    if (!cue || cue.isPotted) return false;

    this.cushionEvents = [];
    this.collisionEvents = [];
    this.potEvents = [];
    this.simulationTime = 0;

    const angleRad = (config.angleDeg * Math.PI) / 180;
    const powerPct = Math.max(0, Math.min(100, config.power)) / 100;
    const speed = powerPct * PHYSICS_CONSTANTS.MAX_CUE_SPEED;

    const dirX = Math.cos(angleRad);
    const dirY = Math.sin(angleRad);

    cue.vel.x = dirX * speed;
    cue.vel.y = dirY * speed;

    const R = PHYSICS_CONSTANTS.BALL_R;
    const side = Math.max(-1, Math.min(1, config.spin.side));
    const vertical = Math.max(-1, Math.min(1, config.spin.vertical));

    // Perpendicular horizontal unit vector: (-dirY, dirX)
    // Pure roll angular velocity is (speed / R) around perp axis.
    // If vertical > 0 (topspin/follow): spin exceeds pure roll.
    // If vertical < 0 (screw/draw): backspin opposing motion!
    const rollOmega = speed / R;
    const vertFactor = vertical >= 0 ? 1.0 + vertical * 1.3 : vertical * 1.6;
    const targetOmegaHoriz = rollOmega * vertFactor;

    // By right-hand rule:
    // v along dirX gives rotation omega_y = +v_x / R
    // v along dirY gives rotation omega_x = -v_y / R
    cue.omega.x = -dirY * targetOmegaHoriz;
    cue.omega.y = dirX * targetOmegaHoriz;

    // Sidespin (English) around vertical Z axis (rad/s)
    // Striking right of center (side > 0) creates counter-clockwise spin (positive omega_z)
    cue.omega.z = side * PHYSICS_CONSTANTS.MAX_SPIN;

    cue.isRolling = false;
    this.isSimulating = true;
    return true;
  }

  /**
   * Step the physics simulation by deltaSeconds using 240Hz sub-stepping.
   * Returns true if simulation is still in motion, false if all balls stopped.
   */
  public update(deltaSeconds: number): boolean {
    if (!this.isSimulating) return false;

    const subDt = PHYSICS_CONSTANTS.SUB_DT;
    const numSubSteps = Math.max(1, Math.min(24, Math.round(deltaSeconds / subDt)));
    const actualDt = deltaSeconds / numSubSteps;

    for (let s = 0; s < numSubSteps; s++) {
      this.subStep(actualDt);
      this.simulationTime += actualDt;

      // Check if all balls are at rest
      if (this.checkRest()) {
        this.isSimulating = false;
        break;
      }
    }

    return this.isSimulating;
  }

  /**
   * Run the simulation until all balls come to a complete rest.
   * Capped at maxDurationSec to prevent runaway loops.
   */
  public simulateToRest(maxDurationSec: number = 8.0): ShotOutcome {
    const subDt = PHYSICS_CONSTANTS.SUB_DT;
    const maxSteps = Math.ceil(maxDurationSec / subDt);

    for (let i = 0; i < maxSteps; i++) {
      this.subStep(subDt);
      this.simulationTime += subDt;
      if (this.checkRest()) break;
    }
    this.isSimulating = false;

    return this.evaluateOutcome();
  }

  /** Evaluate the shot outcome for Snooker Escape practice */
  public evaluateOutcome(targetBallId?: string): ShotOutcome {
    const cue = Array.from(this.balls.values()).find((b) => b.color === "cue");
    const cuePotted = cue ? cue.isPotted : false;

    const target = targetBallId
      ? this.balls.get(targetBallId)
      : Array.from(this.balls.values()).find((b) => b.color === "black");
    const targetPotted = target ? target.isPotted : false;

    const pottedBallIds = this.potEvents.map((e) => e.ballId);

    // First collision involving the cue ball
    const cueCollisions = this.collisionEvents.filter(
      (c) => c.ballIdA === cue?.id || c.ballIdB === cue?.id
    );

    let firstHitBallId: string | null = null;
    let firstHitColor: string | null = null;
    let cushionsBeforeHit = 0;

    if (cueCollisions.length > 0) {
      const firstHit = cueCollisions[0];
      const otherId = firstHit.ballIdA === cue?.id ? firstHit.ballIdB : firstHit.ballIdA;
      const otherColor = firstHit.ballIdA === cue?.id ? firstHit.colorB : firstHit.colorA;
      firstHitBallId = otherId;
      firstHitColor = otherColor;

      // Count cushions before the first ball hit
      cushionsBeforeHit = this.cushionEvents.filter(
        (e) => e.ballId === cue?.id && e.time <= firstHit.time
      ).length;
    }

    const totalCushionsHit = this.cushionEvents.filter((e) => e.ballId === cue?.id).length;

    // Rules evaluation
    const isTargetHitFirst = Boolean(
      target ? firstHitBallId === target.id : firstHitColor === "black"
    );
    let foul = false;
    let foulReason: string | undefined = undefined;

    if (cuePotted) {
      foul = true;
      foulReason = "In-off Foul: Cue ball potted (ขาวลงหลุม)";
    } else if (!firstHitBallId) {
      foul = true;
      foulReason = "Miss Foul: Failed to hit any ball (แทงไม่โดนลูกใดเลย)";
    } else if (!isTargetHitFirst) {
      foul = true;
      foulReason = `Foul: Struck ${firstHitColor?.toUpperCase()} ball first instead of Target (โดนลูกขวางก่อน)`;
    }

    const success = !foul && Boolean(isTargetHitFirst);

    return {
      success,
      firstHitBallId,
      firstHitColor,
      cuePotted,
      targetPotted,
      pottedBallIds,
      cushionsBeforeHit,
      totalCushionsHit,
      foul,
      foulReason,
    };
  }

  /** Single physics sub-step (240Hz) */
  private subStep(dt: number): void {
    const balls = Array.from(this.balls.values()).filter((b) => !b.isPotted);
    const R = PHYSICS_CONSTANTS.BALL_R;
    const g = PHYSICS_CONSTANTS.GRAVITY;
    const m = PHYSICS_CONSTANTS.BALL_MASS;
    const I = (2 / 5) * m * R * R;

    // 1. Friction & Spin integration
    for (const b of balls) {
      const vx = b.vel.x;
      const vy = b.vel.y;
      const speed = Math.hypot(vx, vy);

      // Relative velocity at the cloth contact point r_c = (0, 0, -R)
      // u = v + omega x r_c
      const ux = vx - R * b.omega.y;
      const uy = vy + R * b.omega.x;
      const uLen = Math.hypot(ux, uy);

      if (uLen > 1.2) {
        // Sliding phase (Dynamic Kinetic Friction)
        b.isRolling = false;
        const uHatX = ux / uLen;
        const uHatY = uy / uLen;

        const frictionForceMag = PHYSICS_CONSTANTS.MU_SLIDING * m * g;
        const ax = -(frictionForceMag / m) * uHatX;
        const ay = -(frictionForceMag / m) * uHatY;

        b.vel.x += ax * dt;
        b.vel.y += ay * dt;

        // Torque from sliding friction: r_c x F_s = (0, 0, -R) x (F_x, F_y, 0)
        // tau = (R * F_y, -R * F_x, 0)
        const tauX = R * (m * ay);
        const tauY = -R * (m * ax);

        b.omega.x += (tauX / I) * dt;
        b.omega.y += (tauY / I) * dt;
      } else {
        // Pure Rolling phase
        b.isRolling = true;
        // Lock angular velocity to forward rolling
        b.omega.y = b.vel.x / R;
        b.omega.x = -b.vel.y / R;

        if (speed > 0.4) {
          // Cloth nap directional resistance (Baulk to Black along +X)
          let muRoll = PHYSICS_CONSTANTS.MU_ROLLING;
          if (b.vel.x > 0.5) {
            muRoll *= PHYSICS_CONSTANTS.NAP_BONUS_WITH;
          } else if (b.vel.x < -0.5) {
            muRoll *= PHYSICS_CONSTANTS.NAP_PENALTY_AGAINST;
          }

          const decelMag = muRoll * g;
          let ax = -decelMag * (vx / speed);
          const ay = -decelMag * (vy / speed);

          // Gentle cross-nap drift along +X when traversing the table (y direction)
          if (Math.abs(vy) > 15) {
            const crossFactor = Math.min(1.0, Math.abs(vy) / 250);
            ax += PHYSICS_CONSTANTS.NAP_DRIFT_FACTOR * PHYSICS_CONSTANTS.MU_ROLLING * g * crossFactor;
          }

          b.vel.x += ax * dt;
          b.vel.y += ay * dt;

          b.omega.y = b.vel.x / R;
          b.omega.x = -b.vel.y / R;
        } else {
          b.vel.x = 0;
          b.vel.y = 0;
          b.omega.x = 0;
          b.omega.y = 0;
        }
      }

      // Sidespin (English) cloth decay
      if (Math.abs(b.omega.z) > 0.05) {
        const decayRate = ((5 * PHYSICS_CONSTANTS.MU_SPIN_DECAY * g) / (2 * R)) * dt;
        if (Math.abs(b.omega.z) <= decayRate) {
          b.omega.z = 0;
        } else {
          b.omega.z -= Math.sign(b.omega.z) * decayRate;
        }
      } else {
        b.omega.z = 0;
      }

      // 2. Position update
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;
    }

    // 3. Pocket Potting Check
    for (const b of balls) {
      if (b.isPotted) continue;
      for (const pk of POCKETS) {
        const dx = b.pos.x - pk.pos.x;
        const dy = b.pos.y - pk.pos.y;
        const dist = Math.hypot(dx, dy);

        // Pocket entry threshold (ball center entering pocket drop)
        const potRadius = pk.kind === "corner" ? pk.r * 1.2 : pk.r * 1.1;
        if (dist < potRadius) {
          b.isPotted = true;
          b.pottedPocketId = pk.id;
          b.vel.x = 0;
          b.vel.y = 0;
          b.omega = { x: 0, y: 0, z: 0 };
          this.potEvents.push({
            ballId: b.id,
            color: b.color,
            pocketId: pk.id,
            time: this.simulationTime,
          });
          break;
        }
      }
    }

    // 4. Cushion Collisions
    const W = PHYSICS_CONSTANTS.TABLE_WIDTH;
    const H = PHYSICS_CONSTANTS.TABLE_HEIGHT;
    const noseHeight = PHYSICS_CONSTANTS.CUSHION_NOSE_HEIGHT_OFFSET;

    for (const b of balls) {
      if (b.isPotted) continue;

      // Skip cushion rails if the ball is inside a pocket opening / jaws
      let inPocketMouth = false;
      for (const pk of POCKETS) {
        const mouthRadius = pk.kind === "corner" ? pk.r * 1.55 : pk.r * 1.25;
        if (Math.hypot(b.pos.x - pk.pos.x, b.pos.y - pk.pos.y) < mouthRadius) {
          inPocketMouth = true;
          // If the ball crosses outside the playable slate bounds near a pocket mouth, pot it
          if (b.pos.x < 0 || b.pos.x > W || b.pos.y < 0 || b.pos.y > H) {
            b.isPotted = true;
            b.pottedPocketId = pk.id;
            b.vel.x = 0;
            b.vel.y = 0;
            b.omega = { x: 0, y: 0, z: 0 };
            this.potEvents.push({
              ballId: b.id,
              color: b.color,
              pocketId: pk.id,
              time: this.simulationTime,
            });
          }
          break;
        }
      }
      if (inPocketMouth || b.isPotted) continue;

      let hitSide: "b" | "t" | "l" | "r" | null = null;
      let nx = 0;
      let ny = 0;
      let tx = 0;
      let ty = 0;

      // Left cushion
      if (b.pos.x <= R && b.vel.x < 0) {
        hitSide = "l";
        nx = 1;
        ny = 0;
        tx = 0;
        ty = 1;
        b.pos.x = R;
      }
      // Right cushion
      else if (b.pos.x >= W - R && b.vel.x > 0) {
        hitSide = "r";
        nx = -1;
        ny = 0;
        tx = 0;
        ty = -1;
        b.pos.x = W - R;
      }
      // Bottom cushion
      else if (b.pos.y <= R && b.vel.y < 0) {
        hitSide = "b";
        nx = 0;
        ny = 1;
        tx = -1;
        ty = 0;
        b.pos.y = R;
      }
      // Top cushion
      else if (b.pos.y >= H - R && b.vel.y > 0) {
        hitSide = "t";
        nx = 0;
        ny = -1;
        tx = 1;
        ty = 0;
        b.pos.y = H - R;
      }

      if (hitSide) {
        const vn = b.vel.x * nx + b.vel.y * ny; // negative when entering cushion
        const vt = b.vel.x * tx + b.vel.y * ty;

        const eC = PHYSICS_CONSTANTS.E_CUSHION;
        const muC = PHYSICS_CONSTANTS.MU_CUSHION;

        // Normal impulse
        const Jn = -(1 + eC) * m * vn;
        const newVn = -eC * vn;

        // Height-induced torque: Cushion nose contact at 0.4R above center of mass
        // Normal force pushing inward imparts angular velocity along rail tangent t
        const deltaOmegaTangential = (noseHeight * Jn) / I;
        // Inject rolling torque into omega along rail tangent
        b.omega.x += tx * deltaOmegaTangential;
        b.omega.y += ty * deltaOmegaTangential;

        // Tangential English deflection:
        // Relative surface speed at cushion face: v_c = v + omega x (-R*n) = v_t - R*omega_z
        const relSurfVt = vt - R * b.omega.z;
        const maxJt = (2 / 7) * m * Math.abs(relSurfVt);
        const frictionJt = Math.min(muC * Jn, maxJt);
        const Jt = -Math.sign(relSurfVt) * frictionJt;

        const newVt = vt + Jt / m;
        // Spin conversion: cushion reaction torque is -R*Jt around z
        b.omega.z -= (R * Jt) / I;

        b.vel.x = newVn * nx + newVt * tx;
        b.vel.y = newVn * ny + newVt * ty;

        this.cushionEvents.push({
          ballId: b.id,
          side: hitSide,
          point: { ...b.pos },
          speed: Math.hypot(b.vel.x, b.vel.y),
          time: this.simulationTime,
        });
      }
    }

    // 5. Ball-to-Ball Collisions
    const eBB = PHYSICS_CONSTANTS.E_BB;
    const muBB = PHYSICS_CONSTANTS.MU_BB;

    for (let i = 0; i < balls.length; i++) {
      const b1 = balls[i];
      if (b1.isPotted) continue;

      for (let j = i + 1; j < balls.length; j++) {
        const b2 = balls[j];
        if (b2.isPotted) continue;

        const dx = b2.pos.x - b1.pos.x;
        const dy = b2.pos.y - b1.pos.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 2 * R && dist > 1e-6) {
          const nx = dx / dist;
          const ny = dy / dist;
          const tx = -ny;
          const ty = nx;

          // Relative velocity v1 - v2
          const rvx = b1.vel.x - b2.vel.x;
          const rvy = b1.vel.y - b2.vel.y;
          const vn = rvx * nx + rvy * ny;

          if (vn > 0) {
            // Approaching each other: Resolve collision

            // Position separation to prevent sticking
            const overlap = 2 * R - dist;
            b1.pos.x -= 0.5 * overlap * nx;
            b1.pos.y -= 0.5 * overlap * ny;
            b2.pos.x += 0.5 * overlap * nx;
            b2.pos.y += 0.5 * overlap * ny;

            // Normal impulse
            const Jn = ((1 + eBB) / 2) * m * vn;

            // Relative surface contact tangential velocity
            // Surface vel 1 at contact +R*n: v1 + omega1 x (R*n)
            // Surface vel 2 at contact -R*n: v2 + omega2 x (-R*n)
            const surfVt1 = (b1.vel.x * tx + b1.vel.y * ty) + R * b1.omega.z;
            const surfVt2 = (b2.vel.x * tx + b2.vel.y * ty) - R * b2.omega.z;
            const relSurfVt = surfVt1 - surfVt2;

            // Tangential friction impulse (Cut-Induced Throw & Spin Transfer)
            const maxJt = (2 / 7) * m * Math.abs(relSurfVt);
            const Jt = -Math.sign(relSurfVt) * Math.min(muBB * Jn, maxJt);

            // Apply linear impulses (Jt opposes b1 surface slip, throws b2 in slip direction)
            b1.vel.x += (-Jn * nx + Jt * tx) / m;
            b1.vel.y += (-Jn * ny + Jt * ty) / m;
            b2.vel.x += (Jn * nx - Jt * tx) / m;
            b2.vel.y += (Jn * ny - Jt * ty) / m;

            // Apply spin transfer (around vertical axis Z)
            const deltaSpin = (R * Jt) / I;
            b1.omega.z += deltaSpin;
            b2.omega.z += deltaSpin;

            this.collisionEvents.push({
              ballIdA: b1.id,
              ballIdB: b2.id,
              colorA: b1.color,
              colorB: b2.color,
              point: {
                x: b1.pos.x + nx * R,
                y: b1.pos.y + ny * R,
              },
              impulse: Jn,
              time: this.simulationTime,
            });
          }
        }
      }
    }
  }

  /** Check if all non-potted balls are virtually at rest */
  private checkRest(): boolean {
    const vRest = PHYSICS_CONSTANTS.REST_VELOCITY;
    const wRest = PHYSICS_CONSTANTS.REST_OMEGA;

    for (const b of this.balls.values()) {
      if (b.isPotted) continue;
      const speed = Math.hypot(b.vel.x, b.vel.y);
      const spinSpeed = Math.hypot(b.omega.x, b.omega.y, b.omega.z);
      if (speed > vRest || spinSpeed > wRest) {
        return false;
      }
    }

    // Stop all balls completely
    for (const b of this.balls.values()) {
      b.vel.x = 0;
      b.vel.y = 0;
      b.omega = { x: 0, y: 0, z: 0 };
      b.isRolling = true;
    }
    return true;
  }
}
