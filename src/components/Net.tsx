import { COURT } from '../game/constants.ts';

export function Net() {
  const netWidth = COURT.width + 0.6;
  const netH = COURT.netHeight;
  const postH = COURT.netHeightPost;

  return (
    <group>
      {/* Net mesh (wireframe) */}
      <mesh position={[0, netH / 2, 0]}>
        <planeGeometry args={[netWidth, netH, 40, 10]} />
        <meshStandardMaterial
          color="#ffffff"
          wireframe
          transparent
          opacity={0.6}
          side={2}
        />
      </mesh>

      {/* Top band */}
      <mesh position={[0, netH, 0]} castShadow>
        <boxGeometry args={[netWidth, 0.05, 0.02]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Left post */}
      <mesh position={[-netWidth / 2, postH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, postH, 8]} />
        <meshStandardMaterial color="#444444" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Right post */}
      <mesh position={[netWidth / 2, postH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, postH, 8]} />
        <meshStandardMaterial color="#444444" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Top cable */}
      <mesh position={[0, postH, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.01, 0.01, netWidth, 4]} />
        <meshStandardMaterial color="#333333" metalness={0.8} />
      </mesh>
    </group>
  );
}
