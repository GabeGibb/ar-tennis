import type { InputState } from './types.ts';

export class InputManager {
  private keys = new Set<string>();
  private _mouseDeltaX = 0;
  private _mouseDeltaY = 0;
  private _swing = false;
  private _serve = false;
  private locked = false;

  constructor() {
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
  }

  requestPointerLock(element: HTMLElement) {
    element.requestPointerLock();
  }

  get isLocked() { return this.locked; }

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
      this._mouseDeltaX += e.movementX;
      this._mouseDeltaY += e.movementY;
    }
  };

  private onPointerLockChange = () => {
    this.locked = !!document.pointerLockElement;
  };

  onClick = () => {
    if (!document.pointerLockElement) {
      // Will be handled by the canvas click handler
      return false;
    }
    this._swing = true;
    return true;
  };

  consume(): InputState {
    const state: InputState = {
      forward: this.keys.has('KeyW'),
      backward: this.keys.has('KeyS'),
      left: this.keys.has('KeyA'),
      right: this.keys.has('KeyD'),
      mouseDeltaX: this._mouseDeltaX,
      mouseDeltaY: this._mouseDeltaY,
      swing: this._swing,
      serve: this._serve,
    };

    // Reset per-frame inputs
    this._mouseDeltaX = 0;
    this._mouseDeltaY = 0;
    this._swing = false;
    this._serve = false;

    return state;
  }

  dispose() {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
  }
}
