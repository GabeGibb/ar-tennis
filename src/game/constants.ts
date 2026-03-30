// Real tennis court dimensions in meters
export const COURT = {
  length: 23.77,
  width: 10.97,          // doubles
  singlesWidth: 8.23,    // singles
  serviceDepth: 6.40,    // from net
  netHeight: 0.914,      // center
  netHeightPost: 1.07,   // at posts
  halfLength: 11.885,    // baseline to net
  alleyWidth: 1.37,      // each side
} as const;

// Tennis ball
export const BALL = {
  radius: 0.033,         // ~6.6cm diameter
  mass: 0.058,           // 58 grams
  restitution: 0.75,     // COR on hard court
  friction: 0.6,
} as const;

// Physics
export const PHYSICS = {
  gravity: -9.81,
  airDensity: 1.225,     // kg/m^3
  dragCoefficient: 0.55, // tennis ball Cd
  magnusCoefficient: 0.5,
  fixedTimeStep: 1 / 120,
} as const;

// Player
export const PLAYER = {
  eyeHeight: 1.7,
  moveSpeed: 5.0,        // m/s
  hitReach: 1.5,         // meters — realistic arm + racket length
} as const;

// Practice wall
export const WALL = {
  width: COURT.singlesWidth,  // 8.23m — matches singles court width
  height: 4.0,
  depth: 0.3,
  restitution: 0.85,
} as const;

// Play area bounds (half court)
export const PLAY_AREA = {
  minX: -COURT.singlesWidth / 2,  // -4.115
  maxX: COURT.singlesWidth / 2,   //  4.115
  minZ: 1.0,                      // just in front of wall
  maxZ: COURT.halfLength,         // 11.885 — baseline distance
} as const;
