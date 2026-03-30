import type { Vec3 } from './types.ts';

/** High-level input state — positions/orientations, not raw keys */
export interface PlayerInput {
  /** Player head/eye position in world space */
  position: Vec3;
  /** Player look direction (horizontal) */
  yaw: number;
  /** Player look direction (vertical) */
  pitch: number;
  /** Racket tip position in world space. null = compute from head position */
  racketPosition: Vec3 | null;
  /** Whether a swing action was triggered this frame */
  swing: boolean;
  /** Whether a serve action was triggered this frame */
  serve: boolean;
}

/** Abstract input source — desktop keyboard/mouse, AR tracking, etc. */
export interface InputProvider {
  /** Advance internal state by one physics tick */
  update(dt: number): void;
  /** Return current computed input. One-shot flags (swing/serve) are cleared after read. */
  getInput(): PlayerInput;
  /** Request pointer lock on an element (desktop only) */
  requestPointerLock?(el: HTMLElement): void;
  /** Whether pointer is currently locked (desktop only) */
  isLocked?: boolean;
  /** Handle click event, return true if consumed (desktop only) */
  onClick?(): boolean;
  /** Clean up event listeners */
  dispose(): void;
}
