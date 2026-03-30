import type { InputProvider, PlayerInput } from './input-provider.ts';
import type { Vec3 } from './types.ts';
import { PLAYER, PLAY_AREA } from './constants.ts';

/**
 * Desktop keyboard/mouse input provider.
 * Converts WASD + mouse into positions and orientations.
 */
export class DesktopInputProvider implements InputProvider {
  private keys = new Set<string>();
  private mouseDeltaX = 0;
  private mouseDeltaY = 0;
  private _swing = false;
  private _serve = false;
  private _isLocked = false;

  // Player state (accumulated from input)
  private position: Vec3 = { x: 0, y: PLAYER.eyeHeight, z: 8 };
  private yaw = Math.PI;  // facing negative z (toward wall)
  private pitch = -0.05;

  constructor() {
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
  }

  get isLocked() { return this._isLocked; }

  requestPointerLock(element: HTMLElement) {
    element.requestPointerLock();
  }

  onClick(): boolean {
    if (!document.pointerLockElement) return false;
    this._swing = true;
    return true;
  }

  update(dt: number): void {
    // Apply mouse look
    this.yaw -= this.mouseDeltaX * 0.002;
    this.pitch -= this.mouseDeltaY * 0.002;
    this.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.pitch));

    // Apply WASD movement
    const sinY = Math.sin(this.yaw);
    const cosY = Math.cos(this.yaw);
    let dx = 0, dz = 0;

    if (this.keys.has('KeyW')) { dx -= sinY; dz -= cosY; }
    if (this.keys.has('KeyS')) { dx += sinY; dz += cosY; }
    if (this.keys.has('KeyD')) { dx += cosY; dz -= sinY; }
    if (this.keys.has('KeyA')) { dx -= cosY; dz += sinY; }

    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0) {
      const speed = PLAYER.moveSpeed * dt / len;
      this.position.x += dx * speed;
      this.position.z += dz * speed;
    }

    // Clamp to play area
    this.position.x = Math.max(PLAY_AREA.minX, Math.min(PLAY_AREA.maxX, this.position.x));
    this.position.z = Math.max(PLAY_AREA.minZ, Math.min(PLAY_AREA.maxZ, this.position.z));

    // Reset mouse deltas (consumed this tick)
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
  }

  getInput(): PlayerInput {
    const input: PlayerInput = {
      position: { ...this.position },
      yaw: this.yaw,
      pitch: this.pitch,
      racketPosition: null,  // desktop mode: engine computes from head position
      swing: this._swing,
      serve: this._serve,
    };

    // Clear one-shot flags
    this._swing = false;
    this._serve = false;

    return input;
  }

  dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
  }

  // --- DOM event handlers ---

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code);
    if (e.code === 'Space') {
      this._serve = true;
      e.preventDefault();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement) {
      this.mouseDeltaX += e.movementX;
      this.mouseDeltaY += e.movementY;
    }
  };

  private onPointerLockChange = () => {
    this._isLocked = !!document.pointerLockElement;
  };
}
