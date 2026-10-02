"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useCoachStore, COACH_CUE_ID } from "@/store/coachStore";
import { SPOTS, type Ball } from "@/lib/geometry";
import {
  playStrikeSound,
  playCueStrikeSound,
  playCushionSound,
  playPotSound,
  playPenaltySound,
} from "@/lib/sound";
import {
  SnookerPhysicsEngine,
  computeTrajectoryPreview,
  type BallPhysicsState,
  type TrajectoryPreview,
} from "@/lib/physics";

export interface UseEscapeSimulationReturn {
  simulatedBalls: BallPhysicsState[] | null;
  trajectoryPreview: TrajectoryPreview | null;
  shotOutcome: ReturnType<typeof useCoachStore.getState>["shotOutcome"];
  isSimulating: boolean;
  aimAngleDeg: number;
  power: number;
  handleStrike: () => void;
  handleRetryShot: () => void;
  handleAutoAimBlack: () => void;
  resetSimulation: () => void;
}

/**
 * useEscapeSimulation — encapsulates Snooker physics loop,
 * real-time raycast trajectory preview, sound triggers, and outcome evaluation.
 */
export function useEscapeSimulation(): UseEscapeSimulationReturn {
  const balls = useCoachStore((s) => s.balls);
  const aimAngleDeg = useCoachStore((s) => s.aimAngleDeg);
  const power = useCoachStore((s) => s.power);
  const spin = useCoachStore((s) => s.spin);
  const isSimulating = useCoachStore((s) => s.isSimulating);
  const objectId = useCoachStore((s) => s.objectId);
  const shotOutcome = useCoachStore((s) => s.shotOutcome);

  const setIsSimulating = useCoachStore((s) => s.setIsSimulating);
  const setShotOutcome = useCoachStore((s) => s.setShotOutcome);
  const setAimAngle = useCoachStore((s) => s.setAimAngle);
  const moveBall = useCoachStore((s) => s.moveBall);
  const solve = useCoachStore((s) => s.solve);

  const simRaf = useRef<number>(0);
  const physicsEngineRef = useRef<SnookerPhysicsEngine | null>(null);
  const [simulatedBalls, setSimulatedBalls] = useState<BallPhysicsState[] | null>(null);
  const [preShotBalls, setPreShotBalls] = useState<Ball[] | null>(null);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(simRaf.current);
    };
  }, []);

  // Live Trajectory Guidance preview in Practice Mode
  const trajectoryPreview = useMemo(() => {
    const cueBall = balls.find((b) => b.id === COACH_CUE_ID);
    if (!cueBall || isSimulating) return null;
    return computeTrajectoryPreview(
      cueBall.pos,
      aimAngleDeg,
      power,
      spin,
      balls
    );
  }, [balls, aimAngleDeg, power, spin, isSimulating]);

  // Interactive Practice: Strike Shot physics loop
  const handleStrike = useCallback(() => {
    if (isSimulating) return;

    // Snapshot pre-shot positions for quick retry
    setPreShotBalls(balls.map((b) => ({ ...b, pos: { ...b.pos } })));
    setShotOutcome(null);

    const engine = new SnookerPhysicsEngine(balls);
    physicsEngineRef.current = engine;

    const cueBall = balls.find((b) => b.id === COACH_CUE_ID);
    if (!cueBall) return;

    const ok = engine.strikeCue(
      {
        angleDeg: aimAngleDeg,
        power,
        spin,
      },
      cueBall.id
    );

    if (!ok) return;

    playCueStrikeSound(power);
    setIsSimulating(true);

    let prevCushionCount = 0;
    let prevCollisionCount = 0;
    let prevPotCount = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.04, (now - lastTime) / 1000);
      lastTime = now;

      const stillMoving = engine.update(dt);

      // Sound triggers
      if (engine.cushionEvents.length > prevCushionCount) {
        const latest = engine.cushionEvents[engine.cushionEvents.length - 1];
        playCushionSound(latest.speed);
        prevCushionCount = engine.cushionEvents.length;
      }
      if (engine.collisionEvents.length > prevCollisionCount) {
        playStrikeSound(0.2);
        prevCollisionCount = engine.collisionEvents.length;
      }
      if (engine.potEvents.length > prevPotCount) {
        playPotSound(0.25);
        prevPotCount = engine.potEvents.length;
      }

      setSimulatedBalls(engine.getBalls());

      if (stillMoving) {
        simRaf.current = requestAnimationFrame(step);
      } else {
        const outcome = engine.evaluateOutcome(objectId);
        setShotOutcome(outcome);
        setIsSimulating(false);

        if (outcome.foul) {
          playPenaltySound(0.18);
        } else if (outcome.success) {
          playPotSound(0.2);
        }

        // Sync final resting ball positions back into coach store
        const finalBalls = engine.getBalls();
        for (const fb of finalBalls) {
          if (!fb.isPotted) {
            moveBall(fb.id, fb.pos, true);
          }
        }
        // If cue ball potted, reset to baulk
        const cueFb = finalBalls.find((b) => b.id === cueBall.id);
        if (cueFb?.isPotted) {
          moveBall(cueBall.id, { x: 330, y: 300 }, true);
        }
        // If target ball potted, respawn on black spot for subsequent drills
        const targetFb = finalBalls.find(
          (b) => b.id === objectId || b.color === "black"
        );
        if (targetFb?.isPotted) {
          moveBall(targetFb.id, { ...SPOTS.black }, true);
        }
        solve();
      }
    };

    simRaf.current = requestAnimationFrame(step);
  }, [
    balls,
    aimAngleDeg,
    power,
    spin,
    isSimulating,
    objectId,
    setIsSimulating,
    setShotOutcome,
    moveBall,
    solve,
  ]);

  const handleRetryShot = useCallback(() => {
    cancelAnimationFrame(simRaf.current);
    if (isSimulating) {
      setIsSimulating(false);
    }
    if (preShotBalls) {
      for (const b of preShotBalls) {
        moveBall(b.id, b.pos, true);
      }
      solve();
    }
    setSimulatedBalls(null);
    setShotOutcome(null);
  }, [preShotBalls, isSimulating, setIsSimulating, moveBall, solve, setShotOutcome]);

  const handleAutoAimBlack = useCallback(() => {
    const cueBall = balls.find((b) => b.id === COACH_CUE_ID);
    const blackBall = balls.find((b) => b.color === "black");
    if (!cueBall || !blackBall) return;
    const dx = blackBall.pos.x - cueBall.pos.x;
    const dy = blackBall.pos.y - cueBall.pos.y;
    const deg = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    setAimAngle(Math.round(deg * 10) / 10);
  }, [balls, setAimAngle]);

  const resetSimulation = useCallback(() => {
    cancelAnimationFrame(simRaf.current);
    if (isSimulating) {
      setIsSimulating(false);
    }
    setSimulatedBalls(null);
  }, [isSimulating, setIsSimulating]);

  return {
    simulatedBalls,
    trajectoryPreview,
    shotOutcome,
    isSimulating,
    aimAngleDeg,
    power,
    handleStrike,
    handleRetryShot,
    handleAutoAimBlack,
    resetSimulation,
  };
}
