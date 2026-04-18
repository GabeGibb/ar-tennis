import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { GameEngine } from '../game/engine.ts';
import type { Vec3 } from '../game/types.ts';

interface RacketProps {
  engine: GameEngine;
  racketPosition?: Vec3 | null;
}

export function Racket({ engine, racketPosition }: RacketProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const hw = 0.115;
  const hh = 0.145;

  const verticalStrings = useMemo(() => {
    const strings: Array<{ x: number; maxY: number }> = [];
    for (let i = -6; i <= 6; i++) {
      const x = (i / 6) * hw * 0.85;
      const maxY = Math.sqrt(1 - (x / hw) ** 2) * hh * 0.85;
      strings.push({ x, maxY });
    }
    return strings;
  }, []);

  const horizontalStrings = useMemo(() => {
    const strings: Array<{ y: number; maxX: number }> = [];
    for (let i = -8; i <= 8; i++) {
      const y = (i / 8) * hh * 0.85;
      const maxX = Math.sqrt(1 - (y / hh) ** 2) * hw * 0.85;
      strings.push({ y, maxX });
    }
    return strings;
  }, []);

  const offset = useMemo(() => new THREE.Vector3(), []);
  const swingOffsetVec = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!groupRef.current) return;

    if (racketPosition) {
      // AR mode: use tracked racket position directly
      groupRef.current.position.set(racketPosition.x, racketPosition.y, racketPosition.z);
      groupRef.current.quaternion.copy(camera.quaternion);
    } else {
      // Desktop mode: camera-relative offset
      offset.set(0.35, -0.3, -0.6);
      offset.applyQuaternion(camera.quaternion);

      groupRef.current.position.copy(camera.position).add(offset);
      groupRef.current.quaternion.copy(camera.quaternion);
    }

    groupRef.current.rotateX(-0.3); // tilt racket face up for natural hold

    // Swing animation
    const swingProgress = engine.swingProgress;
    if (swingProgress > 0) {
      const t = swingProgress;
      const swingAngle = Math.sin((1 - t) * Math.PI) * 1.8;
      groupRef.current.rotateX(-swingAngle);

      swingOffsetVec.set(0, 0.1, -0.3 * Math.sin((1 - t) * Math.PI));
      swingOffsetVec.applyQuaternion(camera.quaternion);
      groupRef.current.position.add(swingOffsetVec);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Frame */}
      <mesh scale={[0.88, 1.1, 1]} castShadow>
        <torusGeometry args={[0.13, 0.012, 8, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.5} />
      </mesh>

      {/* Vertical strings */}
      {verticalStrings.map((s, i) => (
        <line key={`v${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([s.x, -s.maxY, 0, s.x, s.maxY, 0]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#dddddd" transparent opacity={0.7} />
        </line>
      ))}

      {/* Horizontal strings */}
      {horizontalStrings.map((s, i) => (
        <line key={`h${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([-s.maxX, s.y, 0, s.maxX, s.y, 0]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#dddddd" transparent opacity={0.7} />
        </line>
      ))}

      {/* Throat */}
      <mesh position={[0, -hh - 0.05, 0]}>
        <cylinderGeometry args={[0.012, 0.015, 0.1, 6]} />
        <meshStandardMaterial color="#222222" metalness={0.3} />
      </mesh>

      {/* Grip */}
      <mesh position={[0, -hh - 0.19, 0]}>
        <cylinderGeometry args={[0.018, 0.016, 0.18, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
    </group>
  );
}
