/**
 * Mesnooker Physics Engine — Types & Physical Constants
 * Standardized for 12ft Snooker Table scaled to 1200x600 units.
 */

export interface Vec2D {
  x: number;
  y: number;
}

export interface Vec3D {
  x: number;
  y: number;
  z: number;
}

export interface CueSpin {
  /** -1.0 (Full Left) to +1.0 (Full Right) */
  side: number;
  /** -1.0 (Full Low / Screw / Draw) to +1.0 (Full High / Topspin / Follow) */
  vertical: number;
}

/** State of a single ball in 3D physics space */
export interface BallPhysicsState {
  id: string;
  color: string;
  pos: Vec2D;
  vel: Vec2D;
  /** Angular velocity (omega_x, omega_y, omega_z) in rad/s */
  omega: Vec3D;
  /** True when relative cloth contact velocity is essentially zero */
  isRolling: boolean;
  isPotted: boolean;
  pottedPocketId?: string;
}

export interface CushionHitEvent {
  ballId: string;
  side: "b" | "t" | "l" | "r";
  point: Vec2D;
  speed: number;
  time: number;
}

export interface BallCollisionEvent {
  ballIdA: string;
  ballIdB: string;
  colorA: string;
  colorB: string;
  point: Vec2D;
  impulse: number;
  time: number;
}

export interface PotEvent {
  ballId: string;
  color: string;
  pocketId: string;
  time: number;
}

export interface ShotOutcome {
  success: boolean;
  firstHitBallId: string | null;
  firstHitColor: string | null;
  cuePotted: boolean;
  targetPotted: boolean;
  pottedBallIds: string[];
  cushionsBeforeHit: number;
  totalCushionsHit: number;
  foul: boolean;
  foulReason?: string;
  contactOffsetRadii?: number;
}

export interface AimShotConfig {
  /** Aim angle in degrees (0 = right along +X, 90 = up along +Y) */
  angleDeg: number;
  /** Power percentage (0 to 100) */
  power: number;
  /** Spin offset (-1 to 1) */
  spin: CueSpin;
}

/** Physics constants */
export const PHYSICS_CONSTANTS = {
  /** Table playable length */
  TABLE_WIDTH: 1200,
  /** Table playable width */
  TABLE_HEIGHT: 600,
  /** Ball radius in table units */
  BALL_R: 24,
  /** Ball mass (kg) */
  BALL_MASS: 0.142,
  /** Gravity acceleration (units/s^2 calibrated to 12ft table) */
  GRAVITY: 3300,
  /** Height of cushion nose contact above ball center (0.4 * R) */
  CUSHION_NOSE_HEIGHT_OFFSET: 0.4 * 24, // 9.6 units
  /** Coefficient of sliding friction on cloth */
  MU_SLIDING: 0.20,
  /** Coefficient of rolling friction on cloth */
  MU_ROLLING: 0.014,
  /** Cloth nap direction: Baulk (x=0) to Black (x=1200) along +X */
  NAP_BONUS_WITH: 0.90, // lower resistance rolling with nap (+X)
  NAP_PENALTY_AGAINST: 1.15, // higher resistance rolling against nap (-X)
  NAP_DRIFT_FACTOR: 0.04, // subtle cross-nap drift
  /** Sidespin cloth decay coefficient */
  MU_SPIN_DECAY: 0.022,
  /** Ball-to-ball coefficient of restitution */
  E_BB: 0.95,
  /** Ball-to-ball friction (causes Cut-Induced Throw and Spin Transfer) */
  MU_BB: 0.042,
  /** Cushion coefficient of restitution */
  E_CUSHION: 0.78,
  /** Cushion tangential friction coefficient (running/check english) */
  MU_CUSHION: 0.22,
  /** Max cue strike speed at 100% power (units/s) */
  MAX_CUE_SPEED: 1350,
  /** Max spin imparted at strike (rad/s) */
  MAX_SPIN: 65,
  /** Sub-step delta time (240Hz) */
  SUB_DT: 1 / 240,
  /** Velocity below which ball is considered stationary */
  REST_VELOCITY: 1.2,
  /** Angular velocity below which ball is considered stationary */
  REST_OMEGA: 0.1,
} as const;
