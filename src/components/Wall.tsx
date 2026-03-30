import { WALL, COURT } from '../game/constants.ts';

const halfW = WALL.width / 2;

export function Wall() {
  return (
    <group>
      {/* Main wall surface */}
      <mesh position={[0, WALL.height / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[WALL.width, WALL.height, WALL.depth]} />
        <meshStandardMaterial color="#8b8b8b" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Target lines on wall */}
      {/* Horizontal line at net height */}
      <mesh position={[0, COURT.netHeight, WALL.depth / 2 + 0.01]}>
        <boxGeometry args={[WALL.width, 0.04, 0.01]} />
        <meshStandardMaterial color="#ff4444" />
      </mesh>

      {/* Top boundary line */}
      <mesh position={[0, WALL.height, WALL.depth / 2 + 0.01]}>
        <boxGeometry args={[WALL.width, 0.04, 0.01]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Side boundary lines */}
      <mesh position={[-halfW, WALL.height / 2, WALL.depth / 2 + 0.01]}>
        <boxGeometry args={[0.04, WALL.height, 0.01]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[halfW, WALL.height / 2, WALL.depth / 2 + 0.01]}>
        <boxGeometry args={[0.04, WALL.height, 0.01]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Service line on ground */}
      <mesh position={[0, 0.002, COURT.serviceDepth]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WALL.width, 0.04]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
