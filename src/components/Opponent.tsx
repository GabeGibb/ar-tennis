import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { COURT } from '../game/constants.ts';
import type { OpponentState } from '../game/types.ts';

interface OpponentProps {
  opponentState: OpponentState;
}

export function Opponent({ opponentState }: OpponentProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.x = opponentState.position.x;
      groupRef.current.position.z = opponentState.position.z;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -COURT.halfLength + 1]}>
      {/* Body */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.8, 4, 8]} />
        <meshStandardMaterial color="#cc3333" roughness={0.7} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#ffcc99" roughness={0.6} />
      </mesh>

      {/* Racket */}
      <group position={[0.4, 1.0, 0]}>
        <mesh>
          <torusGeometry args={[0.1, 0.01, 6, 16]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh position={[0, -0.16, 0]}>
          <cylinderGeometry args={[0.012, 0.015, 0.25, 6]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      </group>
    </group>
  );
}
