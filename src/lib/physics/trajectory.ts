/**
 * Mesnooker Trajectory Raycaster
 * Real-time 8-Ball Pool style aiming guide for Snooker Escape simulator:
 *   - Continuous raycasting with cushion bounces
 *   - English / Sidespin cushion angle deflection preview
 *   - Ghost ball at object/blocker ball contact
 *   - Post-collision target ball line and cue deflection line
 */

import { PHYSICS_CONSTANTS, type CueSpin, type Vec2D } from "./types";

export interface TrajectoryPreview {
  /** Complete path polyline of cue ball up to contact or limit */
  aimPolyline: Vec2D[];
  /** Cushion bounce markers along the path */
  cushionBounces: {
    point: Vec2D;
    side: "b" | "t" | "l" | "r";
    angleDeg: number;
  }[];
  /** Position of the cue ball center at first object contact */
  ghostBall: Vec2D | null;
  /** First ball hit by the cue ball */
  firstHitBall: { id: string; color: string; pos: Vec2D } | null;
  /** True if first ball hit is target (Black) */
  isTargetHit: boolean;
  /** Projected path of the struck target ball */
  targetRay: { from: Vec2D; to: Vec2D } | null;
  /** Projected path of cue ball after collision */
  cueDeflectionRay: { from: Vec2D; to: Vec2D } | null;
  /** Cut angle in degrees (0 = full ball, 90 = grazing thin cut) */
  cutAngleDeg: number | null;
  /** Contact thickness (e.g. "Full", "3/4", "1/2", "1/4", "Thin") */
  thicknessLabel: string | null;
}

export function computeTrajectoryPreview(
  cuePos: Vec2D,
  angleDeg: number,
  power: number,
  spin: CueSpin,
  balls: { id: string; color: string; pos: Vec2D }[],
  targetBallColor: string = "black",
  maxBounces: number = 3
): TrajectoryPreview {
  const R = PHYSICS_CONSTANTS.BALL_R;
  const TWO_R = R * 2;
  const W = PHYSICS_CONSTANTS.TABLE_WIDTH;
  const H = PHYSICS_CONSTANTS.TABLE_HEIGHT;

  const aimPolyline: Vec2D[] = [{ ...cuePos }];
  const cushionBounces: TrajectoryPreview["cushionBounces"] = [];

  let currentPos = { ...cuePos };
  let currentAngleRad = (angleDeg * Math.PI) / 180;
  let remainingBounces = maxBounces;

  let ghostBall: Vec2D | null = null;
  let firstHitBall: { id: string; color: string; pos: Vec2D } | null = null;
  let isTargetHit = false;
  let targetRay: { from: Vec2D; to: Vec2D } | null = null;
  let cueDeflectionRay: { from: Vec2D; to: Vec2D } | null = null;
  let cutAngleDeg: number | null = null;
  let thicknessLabel: string | null = null;

  // Filter out the cue ball itself
  const candidateBalls = balls.filter(
    (b) => b.color !== "cue" && Math.hypot(b.pos.x - cuePos.x, b.pos.y - cuePos.y) > 0.1
  );

  while (remainingBounces >= 0) {
    const dirX = Math.cos(currentAngleRad);
    const dirY = Math.sin(currentAngleRad);

    // 1. Check intersection with all candidate balls
    let closestBallDist = Infinity;
    let closestBall: { id: string; color: string; pos: Vec2D } | null = null;

    for (const b of candidateBalls) {
      const deltaX = currentPos.x - b.pos.x;
      const deltaY = currentPos.y - b.pos.y;

      const B = 2 * (deltaX * dirX + deltaY * dirY);
      const C = deltaX * deltaX + deltaY * deltaY - FOUR_R_SQ;
      const disc = B * B - 4 * C;

      if (disc >= 0) {
        const sqrtDisc = Math.sqrt(disc);
        const t1 = (-B - sqrtDisc) / 2;
        const t2 = (-B + sqrtDisc) / 2;

        let tHit = -1;
        if (t1 > 0.05) {
          tHit = t1;
        } else if (t2 > 0.05) {
          tHit = t2;
        }

        if (tHit > 0.05 && tHit < closestBallDist) {
          closestBallDist = tHit;
          closestBall = b;
        }
      }
    }

    // 2. Check intersection with table cushions
    let cushionDist = Infinity;
    let cushionSide: "b" | "t" | "l" | "r" | null = null;

    // Left cushion x = R
    if (dirX < -1e-6) {
      const t = (R - currentPos.x) / dirX;
      if (t > 0.05 && t < cushionDist) {
        cushionDist = t;
        cushionSide = "l";
      }
    }
    // Right cushion x = W - R
    if (dirX > 1e-6) {
      const t = (W - R - currentPos.x) / dirX;
      if (t > 0.05 && t < cushionDist) {
        cushionDist = t;
        cushionSide = "r";
      }
    }
    // Bottom cushion y = R
    if (dirY < -1e-6) {
      const t = (R - currentPos.y) / dirY;
      if (t > 0.05 && t < cushionDist) {
        cushionDist = t;
        cushionSide = "b";
      }
    }
    // Top cushion y = H - R
    if (dirY > 1e-6) {
      const t = (H - R - currentPos.y) / dirY;
      if (t > 0.05 && t < cushionDist) {
        cushionDist = t;
        cushionSide = "t";
      }
    }

    // Determine what we hit first: ball or cushion
    if (closestBall && closestBallDist < cushionDist) {
      // Hit a ball!
      const ghostX = currentPos.x + dirX * closestBallDist;
      const ghostY = currentPos.y + dirY * closestBallDist;
      ghostBall = { x: ghostX, y: ghostY };
      firstHitBall = closestBall;
      isTargetHit = closestBall.color === targetBallColor;

      aimPolyline.push({ x: ghostX, y: ghostY });

      // Calculate ball-to-ball post-impact rays
      const normalX = (closestBall.pos.x - ghostX) / TWO_R;
      const normalY = (closestBall.pos.y - ghostY) / TWO_R;
      const tangentX = -normalY;
      const tangentY = normalX;

      // Cut angle: dot product between ray direction and collision normal
      const cosCut = Math.max(-1, Math.min(1, dirX * normalX + dirY * normalY));
      const cutRad = Math.acos(cosCut);
      cutAngleDeg = Math.round((cutRad * 180) / Math.PI);

      // Contact thickness classification
      if (cutAngleDeg < 15) thicknessLabel = "หนาเต็มใบ (Full Ball)";
      else if (cutAngleDeg < 35) thicknessLabel = "หนา 3/4 ใบ (3/4 Ball)";
      else if (cutAngleDeg < 55) thicknessLabel = "หนาครึ่งใบ (1/2 Ball)";
      else if (cutAngleDeg < 75) thicknessLabel = "บาง 1/4 ใบ (1/4 Ball)";
      else thicknessLabel = "บางเฉียบ (Thin Cut)";

      // Power scaling for preview lines
      const powerFactor = Math.max(0.3, Math.min(1.0, power / 100));
      const targetLen = Math.max(70, 240 * powerFactor * cosCut);

      // Target launch vector (includes small Cut-Induced Throw)
      const citAngle = (spin.side * 1.5 * Math.PI) / 180;
      const targetDirX = normalX * Math.cos(citAngle) - normalY * Math.sin(citAngle);
      const targetDirY = normalX * Math.sin(citAngle) + normalY * Math.cos(citAngle);

      targetRay = {
        from: { ...closestBall.pos },
        to: {
          x: closestBall.pos.x + targetDirX * targetLen,
          y: closestBall.pos.y + targetDirY * targetLen,
        },
      };

      // Cue ball post-impact deflection (Stun tangent line + Follow/Draw curve vector)
      const dotTangent = dirX * tangentX + dirY * tangentY;
      const cueStunDirX = tangentX * Math.sign(dotTangent || 1);
      const cueStunDirY = tangentY * Math.sign(dotTangent || 1);

      // Vertical spin influence:
      // High topspin pulls toward initial aim direction dirX, dirY
      // Low screw/draw pulls backward along -dirX, -dirY
      const spinInfluence = spin.vertical * 0.45;
      const cueDeflectX = cueStunDirX * (1 - Math.abs(spinInfluence)) + dirX * spinInfluence;
      const cueDeflectY = cueStunDirY * (1 - Math.abs(spinInfluence)) + dirY * spinInfluence;
      const cueDeflectLen = Math.hypot(cueDeflectX, cueDeflectY) || 1;

      const cueRayLen = Math.max(50, 160 * powerFactor * (1 - cosCut * 0.5));
      cueDeflectionRay = {
        from: { x: ghostX, y: ghostY },
        to: {
          x: ghostX + (cueDeflectX / cueDeflectLen) * cueRayLen,
          y: ghostY + (cueDeflectY / cueDeflectLen) * cueRayLen,
        },
      };

      break; // Aim ray ends at the first ball
    } else if (cushionSide && cushionDist < Infinity && remainingBounces > 0) {
      // Hit a cushion!
      const bounceX = currentPos.x + dirX * cushionDist;
      const bounceY = currentPos.y + dirY * cushionDist;
      const bouncePoint = { x: bounceX, y: bounceY };

      aimPolyline.push(bouncePoint);

      // Incidence angle off the rail
      let angleOffRailDeg = 0;
      let newDirX = dirX;
      let newDirY = dirY;
      let railTangentSide = 1;

      if (cushionSide === "l" || cushionSide === "r") {
        angleOffRailDeg = (Math.abs(Math.atan2(dirX, dirY)) * 180) / Math.PI;
        newDirX = -dirX;
        railTangentSide = cushionSide === "l" ? 1 : -1;
      } else {
        angleOffRailDeg = (Math.abs(Math.atan2(dirY, dirX)) * 180) / Math.PI;
        newDirY = -dirY;
        railTangentSide = cushionSide === "b" ? -1 : 1;
      }

      cushionBounces.push({
        point: bouncePoint,
        side: cushionSide,
        angleDeg: Math.round(angleOffRailDeg),
      });

      // Side spin (English) deflection on cushion bounce:
      // Running side opens the rebound angle; check side closes it
      let reboundAngleRad = Math.atan2(newDirY, newDirX);
      const englishShift = spin.side * railTangentSide * 0.12; // ~7 degrees max
      reboundAngleRad += englishShift;

      currentPos = bouncePoint;
      currentAngleRad = reboundAngleRad;
      remainingBounces--;
    } else {
      // Ray continues into empty table up to max reach
      const maxReach = 600;
      aimPolyline.push({
        x: currentPos.x + dirX * maxReach,
        y: currentPos.y + dirY * maxReach,
      });
      break;
    }
  }

  return {
    aimPolyline,
    cushionBounces,
    ghostBall,
    firstHitBall,
    isTargetHit,
    targetRay,
    cueDeflectionRay,
    cutAngleDeg,
    thicknessLabel,
  };
}

const FOUR_R_SQ = 4 * PHYSICS_CONSTANTS.BALL_R * PHYSICS_CONSTANTS.BALL_R;
