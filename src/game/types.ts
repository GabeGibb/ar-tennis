export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type Side = 'player' | 'opponent';

export interface BallState {
  position: Vec3;
  velocity: Vec3;
  angularVelocity: Vec3;
  isInPlay: boolean;
  lastHitBy: Side | null;
  bounceCount: number;
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  mouseDeltaX: number;
  mouseDeltaY: number;
  swing: boolean;
  serve: boolean;
}

export interface PlayerState {
  position: Vec3;
  yaw: number;
  pitch: number;
}
