export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface BallState {
  position: Vec3;
  velocity: Vec3;
  angularVelocity: Vec3;
  isInPlay: boolean;
  lastHitBy: 'player' | null;
  bounceCount: number;
}

export interface PlayerState {
  position: Vec3;
  yaw: number;
  pitch: number;
}
