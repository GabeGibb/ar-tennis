import { BALL, PHYSICS, PLAYER } from './constants.ts';
import type { Vec3, BallState, PlayerState, InputState } from './types.ts';

// Simple AABB box for collision
interface Box {
  minX: number; maxX: number;
  minY: number; maxY: number;
  minZ: number; maxZ: number;
  restitution: number;
}

export class GameEngine {
  // Ball
  private _ballState: BallState = {
    position: { x: 0, y: 1.0, z: 5 },
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
    isInPlay: false,
    lastHitBy: null,
    bounceCount: 0,
  };

  // Player
  private _playerState: PlayerState = {
    position: { x: 0, y: PLAYER.eyeHeight, z: 8 },
    yaw: Math.PI,
    pitch: -0.05,
  };

  // Colliders
  private wall: Box = {
    minX: -4, maxX: 4,
    minY: 0, maxY: 4,
    minZ: -0.15, maxZ: 0.15,
    restitution: 0.85,
  };

  // Stats
  private _rallyCount = 0;
  private _bestRally = 0;
  private _waitingForServe = true;
  private _infoText = 'Press SPACE to launch ball';

  // Swing animation state (0 = idle, >0 = swinging)
  private _swingTimer = 0;
  private static SWING_DURATION = 0.3;

  private listeners: Array<() => void> = [];

  get ballState(): Readonly<BallState> { return this._ballState; }
  get playerState(): Readonly<PlayerState> { return this._playerState; }
  get rallyCount() { return this._rallyCount; }
  get bestRally() { return this._bestRally; }
  get waitingForServe() { return this._waitingForServe; }
  get infoText() { return this._infoText; }
  get swingProgress() { return this._swingTimer > 0 ? this._swingTimer / GameEngine.SWING_DURATION : 0; }

  subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private notify() {
    for (const fn of this.listeners) fn();
  }

  async init() {
    // No async init needed anymore — no WASM!
  }

  step(input: InputState) {
    const dt = PHYSICS.fixedTimeStep;

    this.updatePlayer(input, dt);

    if (input.serve && this._waitingForServe) {
      this.launchBall();
    }

    if (input.swing) {
      this._swingTimer = GameEngine.SWING_DURATION;
      if (this._ballState.isInPlay) {
        this.tryHit();
      }
    }

    // Tick swing animation
    if (this._swingTimer > 0) {
      this._swingTimer = Math.max(0, this._swingTimer - dt);
    }

    if (this._ballState.isInPlay) {
      this.physicsTick(dt);
    }

    this.checkBallState();
    this.updateInfo();
    this.notify();
  }

  // Track previous z for wall crossing detection
  private prevZ = 5;
  private prevY = 1;
  private groundBounceFrame = -1;
  private frameCount = 0;

  private physicsTick(dt: number) {
    const b = this._ballState;
    const r = BALL.radius;
    this.frameCount++;

    // Save previous position for crossing detection
    this.prevZ = b.position.z;
    this.prevY = b.position.y;

    // --- Gravity ---
    b.velocity.y += PHYSICS.gravity * dt;

    // --- Air drag ---
    const speed = Math.sqrt(b.velocity.x ** 2 + b.velocity.y ** 2 + b.velocity.z ** 2);
    if (speed > 0.01) {
      const area = Math.PI * r * r;
      const dragMag = 0.5 * PHYSICS.dragCoefficient * area * PHYSICS.airDensity * speed * speed;
      const dragScale = (dragMag / speed) * dt / BALL.mass;
      b.velocity.x -= b.velocity.x * dragScale;
      b.velocity.y -= b.velocity.y * dragScale;
      b.velocity.z -= b.velocity.z * dragScale;

      // --- Magnus effect (spin curves the ball) ---
      const ax = b.angularVelocity.x, ay = b.angularVelocity.y, az = b.angularVelocity.z;
      const angSpeed = Math.sqrt(ax * ax + ay * ay + az * az);
      if (angSpeed > 0.1) {
        const k = PHYSICS.magnusCoefficient * r * PHYSICS.airDensity * area * dt / BALL.mass;
        b.velocity.x += (ay * b.velocity.z - az * b.velocity.y) * k;
        b.velocity.y += (az * b.velocity.x - ax * b.velocity.z) * k;
        b.velocity.z += (ax * b.velocity.y - ay * b.velocity.x) * k;
      }
    }

    // --- Spin decay ---
    b.angularVelocity.x *= 0.998;
    b.angularVelocity.y *= 0.998;
    b.angularVelocity.z *= 0.998;

    // --- Move ---
    b.position.x += b.velocity.x * dt;
    b.position.y += b.velocity.y * dt;
    b.position.z += b.velocity.z * dt;

    // --- Ground collision (y = 0) ---
    if (b.position.y < r && b.velocity.y < 0) {
      b.position.y = r;
      b.velocity.y = -b.velocity.y * BALL.restitution;
      b.velocity.x *= 0.92;
      b.velocity.z *= 0.92;
      // Only count bounce once (not every frame we're near ground)
      if (this.groundBounceFrame !== this.frameCount - 1) {
        b.bounceCount++;
      }
      this.groundBounceFrame = this.frameCount;
    }

    // --- Wall collision ---
    // The wall front face is at z = wallFaceZ.
    // Use sweep test: did the ball cross this plane this frame?
    const w = this.wall;
    const wallFaceZ = w.maxZ + r; // ball surface touches wall when center is here

    // Ball crossed the wall plane from +z to -z this frame
    if (this.prevZ >= wallFaceZ && b.position.z < wallFaceZ && b.velocity.z < 0) {
      // Check if it would hit within the wall bounds (x and y)
      // Interpolate position at crossing time
      const t = (this.prevZ - wallFaceZ) / (this.prevZ - b.position.z);
      const hitX = this.prevZ + (b.position.x - (this.prevZ - b.position.z > 0.001
        ? (b.position.x - b.velocity.x * dt) : b.position.x)) * t;
      // Simpler: just use current x/y
      const bx = b.position.x;
      const by = b.position.y;

      if (bx > w.minX - r && bx < w.maxX + r && by > w.minY && by < w.maxY + r) {
        // Wall hit!
        b.position.z = wallFaceZ;
        b.velocity.z = -b.velocity.z * w.restitution;
        // Slight angle variation
        b.velocity.x += (Math.random() - 0.5) * 0.8;
        b.velocity.y += (Math.random() - 0.5) * 0.3;
      }
    }

    // Ball hit above the wall (missed high)
    // Ball hit side edges of wall — just let it go, it missed

    // Ceiling clamp (if ball goes absurdly high)
    if (b.position.y > 20) {
      b.velocity.y = -Math.abs(b.velocity.y) * 0.5;
    }
  }

  private updatePlayer(input: InputState, dt: number) {
    const s = this._playerState;

    s.yaw -= input.mouseDeltaX * 0.002;
    s.pitch -= input.mouseDeltaY * 0.002;
    s.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, s.pitch));

    const sinY = Math.sin(s.yaw);
    const cosY = Math.cos(s.yaw);
    let dx = 0, dz = 0;

    if (input.forward) { dx -= sinY; dz -= cosY; }
    if (input.backward) { dx += sinY; dz += cosY; }
    if (input.right) { dx += cosY; dz -= sinY; }
    if (input.left) { dx -= cosY; dz += sinY; }

    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0) {
      const speed = PLAYER.moveSpeed * dt / len;
      s.position.x += dx * speed;
      s.position.z += dz * speed;
    }

    s.position.x = Math.max(-6, Math.min(6, s.position.x));
    s.position.z = Math.max(1.5, Math.min(15, s.position.z));
  }

  private launchBall() {
    const b = this._ballState;
    const px = this._playerState.position.x;
    const pz = this._playerState.position.z;

    b.position.x = px;
    b.position.y = 1.5;
    b.position.z = pz - 0.5;
    b.velocity.x = (Math.random() - 0.5) * 2;
    b.velocity.y = 3;
    b.velocity.z = -14;
    b.angularVelocity.x = -15;
    b.angularVelocity.y = 0;
    b.angularVelocity.z = 0;
    b.isInPlay = true;
    b.bounceCount = 0;
    b.lastHitBy = 'player';

    this._rallyCount = 0;
    this._waitingForServe = false;
  }

  private tryHit() {
    const ballPos = this._ballState.position;
    const p = this._playerState;

    // Racket is in front of and below the player's eyes
    const fwdX = -Math.sin(p.yaw);
    const fwdZ = -Math.cos(p.yaw);
    const racketX = p.position.x + fwdX * 0.8;
    const racketY = p.position.y - 0.4;
    const racketZ = p.position.z + fwdZ * 0.8;

    const dx = ballPos.x - racketX;
    const dy = ballPos.y - racketY;
    const dz = ballPos.z - racketZ;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist > PLAYER.hitReach) return;

    this._rallyCount++;
    if (this._rallyCount > this._bestRally) {
      this._bestRally = this._rallyCount;
    }

    // Aim toward the wall
    const hitPower = 15 + Math.random() * 3;
    const targetX = (Math.random() - 0.5) * 5;
    const targetY = 1.0 + Math.random() * 2.5;
    const targetZ = 0.2;

    const aimX = targetX - ballPos.x;
    const aimY = targetY - ballPos.y;
    const aimZ = targetZ - ballPos.z;
    const aimLen = Math.sqrt(aimX * aimX + aimY * aimY + aimZ * aimZ);

    this._ballState.velocity.x = (aimX / aimLen) * hitPower;
    this._ballState.velocity.y = (aimY / aimLen) * hitPower;
    this._ballState.velocity.z = (aimZ / aimLen) * hitPower;

    // Topspin
    this._ballState.angularVelocity.x = -20 + Math.random() * 10;
    this._ballState.angularVelocity.y = (Math.random() - 0.5) * 10;
    this._ballState.angularVelocity.z = 0;

    this._ballState.lastHitBy = 'player';
    this._ballState.bounceCount = 0;
  }

  private checkBallState() {
    if (!this._ballState.isInPlay) return;

    const pos = this._ballState.position;
    const vel = this._ballState.velocity;
    const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);

    const outOfBounds = Math.abs(pos.x) > 15 || pos.z > 25 || pos.z < -5 || pos.y < -1 || pos.y > 20;
    const stopped = this._ballState.bounceCount >= 4 || (speed < 0.3 && pos.y < BALL.radius + 0.02);

    if (outOfBounds || stopped) {
      this._ballState.isInPlay = false;
      this._waitingForServe = true;
      this._ballState.position = { x: 0, y: 1.0, z: 5 };
      this._ballState.velocity = { x: 0, y: 0, z: 0 };
      this._ballState.angularVelocity = { x: 0, y: 0, z: 0 };
      this._ballState.bounceCount = 0;
    }
  }

  private updateInfo() {
    if (this._waitingForServe) {
      this._infoText = 'Press SPACE to launch | Click to lock mouse';
    } else {
      this._infoText = 'WASD move | Click to hit';
    }
  }

  dispose() {
    this.listeners = [];
  }
}
