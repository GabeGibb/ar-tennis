import { BALL, PHYSICS, WALL } from './constants.ts';
import type { BallState, Vec3 } from './types.ts';

export interface WallCollider {
  minX: number; maxX: number;
  minY: number; maxY: number;
  minZ: number; maxZ: number;
  restitution: number;
}

export class PhysicsWorld {
  private prevX = 0;
  private prevZ = 5;
  private prevY = 1;
  private groundBounceFrame = -1;
  private frameCount = 0;

  private wall: WallCollider;

  constructor() {
    const halfW = WALL.width / 2;
    const halfD = WALL.depth / 2;
    this.wall = {
      minX: -halfW, maxX: halfW,
      minY: 0, maxY: WALL.height,
      minZ: -halfD, maxZ: halfD,
      restitution: WALL.restitution,
    };
  }

  /** Advance ball physics by one fixed timestep */
  step(ball: BallState, dt: number): void {
    const r = BALL.radius;
    this.frameCount++;

    // Save previous position for swept collision
    this.prevX = ball.position.x;
    this.prevY = ball.position.y;
    this.prevZ = ball.position.z;

    // --- Gravity ---
    ball.velocity.y += PHYSICS.gravity * dt;

    // --- Air drag ---
    const speed = Math.sqrt(
      ball.velocity.x ** 2 + ball.velocity.y ** 2 + ball.velocity.z ** 2
    );
    if (speed > 0.01) {
      const area = Math.PI * r * r;
      const dragMag = 0.5 * PHYSICS.dragCoefficient * area * PHYSICS.airDensity * speed * speed;
      const dragScale = (dragMag / speed) * dt / BALL.mass;
      ball.velocity.x -= ball.velocity.x * dragScale;
      ball.velocity.y -= ball.velocity.y * dragScale;
      ball.velocity.z -= ball.velocity.z * dragScale;

      // --- Magnus effect (spin curves the ball) ---
      const ax = ball.angularVelocity.x;
      const ay = ball.angularVelocity.y;
      const az = ball.angularVelocity.z;
      const angSpeed = Math.sqrt(ax * ax + ay * ay + az * az);
      if (angSpeed > 0.1) {
        const k = PHYSICS.magnusCoefficient * r * PHYSICS.airDensity * area * dt / BALL.mass;
        ball.velocity.x += (ay * ball.velocity.z - az * ball.velocity.y) * k;
        ball.velocity.y += (az * ball.velocity.x - ax * ball.velocity.z) * k;
        ball.velocity.z += (ax * ball.velocity.y - ay * ball.velocity.x) * k;
      }
    }

    // --- Spin decay ---
    ball.angularVelocity.x *= 0.998;
    ball.angularVelocity.y *= 0.998;
    ball.angularVelocity.z *= 0.998;

    // --- Move ---
    ball.position.x += ball.velocity.x * dt;
    ball.position.y += ball.velocity.y * dt;
    ball.position.z += ball.velocity.z * dt;

    // --- Ground collision (y = 0) ---
    if (ball.position.y < r && ball.velocity.y < 0) {
      ball.position.y = r;
      ball.velocity.y = -ball.velocity.y * BALL.restitution;
      ball.velocity.x *= 0.92;
      ball.velocity.z *= 0.92;
      // Only count bounce once per contact
      if (this.groundBounceFrame !== this.frameCount - 1) {
        ball.bounceCount++;
      }
      this.groundBounceFrame = this.frameCount;
    }

    // --- Wall collision (swept plane test) ---
    this.wallCollision(ball, r);

    // --- Ceiling clamp ---
    if (ball.position.y > 20) {
      ball.velocity.y = -Math.abs(ball.velocity.y) * 0.5;
    }
  }

  private wallCollision(ball: BallState, r: number): void {
    const w = this.wall;
    const wallFaceZ = w.maxZ + r; // ball surface touches wall when center is here

    // Ball crossed the wall plane from +z to -z this frame?
    if (this.prevZ >= wallFaceZ && ball.position.z < wallFaceZ && ball.velocity.z < 0) {
      // Interpolate position at crossing time
      const dz = this.prevZ - ball.position.z;
      const t = dz > 0.001 ? (this.prevZ - wallFaceZ) / dz : 0;
      const hitX = this.prevX + (ball.position.x - this.prevX) * t;
      const hitY = this.prevY + (ball.position.y - this.prevY) * t;

      // Check if hit is within wall bounds
      if (hitX > w.minX - r && hitX < w.maxX + r && hitY > w.minY && hitY < w.maxY + r) {
        // Wall hit — set position to contact point
        ball.position.z = wallFaceZ;
        ball.position.x = hitX;
        ball.position.y = hitY;
        ball.velocity.z = -ball.velocity.z * w.restitution;

        // Spin-based deflection instead of random perturbation
        // Sidespin (y-axis angular velocity) deflects horizontally
        // Topspin/backspin (x-axis angular velocity) affects vertical bounce
        const spinDeflection = 0.02;
        ball.velocity.x += ball.angularVelocity.y * spinDeflection;
        ball.velocity.y += ball.angularVelocity.x * spinDeflection;
      }
    }
  }

  /** Reset tracking state (call when ball is reset) */
  resetTracking(position: Vec3): void {
    this.prevX = position.x;
    this.prevY = position.y;
    this.prevZ = position.z;
    this.groundBounceFrame = -1;
  }
}
