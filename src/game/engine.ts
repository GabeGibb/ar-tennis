import { BALL, PHYSICS, PLAYER } from './constants.ts';
import type { BallState, PlayerState } from './types.ts';
import type { PlayerInput } from './input-provider.ts';
import { PhysicsWorld } from './physics.ts';

export class GameEngine {
  private _ballState: BallState = {
    position: { x: 0, y: 1.0, z: 5 },
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
    isInPlay: false,
    lastHitBy: null,
    bounceCount: 0,
  };

  private _playerState: PlayerState = {
    position: { x: 0, y: PLAYER.eyeHeight, z: 8 },
    yaw: Math.PI,
    pitch: -0.05,
  };

  private physics = new PhysicsWorld();

  private _rallyCount = 0;
  private _bestRally = 0;
  private _waitingForServe = true;
  private _infoText = 'Serve to start';

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

  step(input: PlayerInput) {
    const dt = PHYSICS.fixedTimeStep;

    // Update player state from input provider
    this._playerState.position = { ...input.position };
    this._playerState.yaw = input.yaw;
    this._playerState.pitch = input.pitch;

    if (input.serve && this._waitingForServe) {
      this.launchBall();
    }

    if (input.swing) {
      this._swingTimer = GameEngine.SWING_DURATION;
      if (this._ballState.isInPlay) {
        this.tryHit(input);
      }
    }

    // Tick swing animation
    if (this._swingTimer > 0) {
      this._swingTimer = Math.max(0, this._swingTimer - dt);
    }

    if (this._ballState.isInPlay) {
      this.physics.step(this._ballState, dt);
    }

    this.checkBallState();
    this.updateInfo();
    this.notify();
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

    this.physics.resetTracking(b.position);
    this._rallyCount = 0;
    this._waitingForServe = false;
  }

  private tryHit(input: PlayerInput) {
    const ballPos = this._ballState.position;
    const p = this._playerState;

    // Use tracked racket position if available (AR mode), else compute from head
    let racketX: number, racketY: number, racketZ: number;
    if (input.racketPosition) {
      racketX = input.racketPosition.x;
      racketY = input.racketPosition.y;
      racketZ = input.racketPosition.z;
    } else {
      const fwdX = -Math.sin(p.yaw);
      const fwdZ = -Math.cos(p.yaw);
      racketX = p.position.x + fwdX * 0.8;
      racketY = p.position.y - 0.4;
      racketZ = p.position.z + fwdZ * 0.8;
    }

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
      this.physics.resetTracking(this._ballState.position);
    }
  }

  private updateInfo() {
    if (this._waitingForServe) {
      this._infoText = 'Serve to start';
    } else {
      this._infoText = 'Hit the ball!';
    }
  }

  dispose() {
    this.listeners = [];
  }
}
