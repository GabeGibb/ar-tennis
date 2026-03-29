import * as THREE from 'three';

export function Wall() {
  return (
    <group>
      {/* Main wall surface */}
      <mesh position={[0, 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[8, 4, 0.3]} />
        <meshStandardMaterial color="#8b8b8b" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Target lines on wall */}
      {/* Horizontal line at net height */}
      <mesh position={[0, 0.914, 0.16]}>
        <boxGeometry args={[8, 0.04, 0.01]} />
        <meshStandardMaterial color="#ff4444" />
      </mesh>

      {/* Top boundary line */}
      <mesh position={[0, 4, 0.16]}>
        <boxGeometry args={[8, 0.04, 0.01]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Side boundary lines */}
      <mesh position={[-4, 2, 0.16]}>
        <boxGeometry args={[0.04, 4, 0.01]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[4, 2, 0.16]}>
        <boxGeometry args={[0.04, 4, 0.01]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Service line on ground */}
      <mesh position={[0, 0.002, 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 0.04]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
