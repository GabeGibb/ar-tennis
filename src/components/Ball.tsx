import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { BALL } from '../game/constants.ts';
import type { BallState } from '../game/types.ts';

const VISUAL_SCALE = 4;
const VISUAL_RADIUS = BALL.radius * VISUAL_SCALE;

function createBallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#c8d530';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.fillStyle = `rgba(${180 + Math.random() * 30}, ${190 + Math.random() * 30}, ${40 + Math.random() * 20}, 0.3)`;
    ctx.fillRect(x, y, 1, 1);
  }

  // Two seam curves for a more realistic tennis ball look
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i <= 256; i++) {
    const x = i;
    const y = 128 + Math.sin((i / 256) * Math.PI * 2) * 55;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.beginPath();
  for (let i = 0; i <= 256; i++) {
    const x = i;
    const y = 128 - Math.sin((i / 256) * Math.PI * 2 + Math.PI) * 55;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

interface BallProps {
  ballState: BallState;
}

export function Ball({ ballState }: BallProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ballMeshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => createBallTexture(), []);

  useFrame(({ camera }, delta) => {
    if (!groupRef.current) return;

    groupRef.current.position.set(
      ballState.position.x,
      ballState.position.y,
      ballState.position.z,
    );

    // Spin the ball mesh based on angular velocity
    if (ballMeshRef.current) {
      const av = ballState.angularVelocity;
      ballMeshRef.current.rotation.x += av.x * delta;
      ballMeshRef.current.rotation.y += av.y * delta;
      ballMeshRef.current.rotation.z += av.z * delta;
    }

    // Billboard the ring
    if (ringRef.current) {
      ringRef.current.lookAt(camera.position);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={ballMeshRef} castShadow>
        <sphereGeometry args={[VISUAL_RADIUS, 24, 24]} />
        <meshStandardMaterial map={texture} roughness={0.85} metalness={0} />
      </mesh>

      <mesh ref={ringRef}>
        <ringGeometry args={[VISUAL_RADIUS * 1.05, VISUAL_RADIUS * 1.35, 32]} />
        <meshBasicMaterial
          color="#e8ff30"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
