import type { InputProvider, PlayerInput } from './input-provider.ts';
import type { Vec3 } from './types.ts';
import { PLAYER } from './constants.ts';

/**
 * AR input provider stub.
 * Receives position/orientation from external tracking hardware.
 * Call setTrackingData() from your hardware integration layer.
 */
export class ArInputProvider implements InputProvider {
  private input: PlayerInput = {
    position: { x: 0, y: PLAYER.eyeHeight, z: 8 },
    yaw: Math.PI,
    pitch: 0,
    racketPosition: null,
    swing: false,
    serve: false,
  };

  /** Push tracking data from external hardware */
  setTrackingData(head: { position: Vec3; yaw: number; pitch: number },
                  racket?: { position: Vec3 }) {
    this.input.position = { ...head.position };
    this.input.yaw = head.yaw;
    this.input.pitch = head.pitch;
    this.input.racketPosition = racket ? { ...racket.position } : null;
  }

  /** Trigger a swing (call from gesture detection or controller button) */
  triggerSwing() { this.input.swing = true; }

  /** Trigger a serve (call from gesture detection or controller button) */
  triggerServe() { this.input.serve = true; }

  update(_dt: number): void {
    // No-op: tracking data is pushed, not polled
  }

  getInput(): PlayerInput {
    const result = { ...this.input };
    // Clear one-shot flags
    this.input.swing = false;
    this.input.serve = false;
    return result;
  }

  dispose(): void {
    // No listeners to clean up
  }
}
