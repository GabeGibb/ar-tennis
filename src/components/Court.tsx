import { useMemo } from 'react';
import * as THREE from 'three';
import { COURT } from '../game/constants.ts';

function CourtLine({ position, size }: { position: [number, number, number]; size: [number, number] }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={size} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  );
}

export function Court() {
  const hw = COURT.width / 2;
  const hsw = COURT.singlesWidth / 2;
  const hl = COURT.halfLength;
  const sd = COURT.serviceDepth;
  const lt = 0.05; // line thickness
  const lh = 0.003; // line height above court

  return (
    <group>
      {/* Green surround */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[COURT.width + 8, COURT.length + 12]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.8} />
      </mesh>

      {/* Blue hard court */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[COURT.width, COURT.length]} />
        <meshStandardMaterial color="#1a6bc4" roughness={0.7} />
      </mesh>

      {/* Court lines */}
      {/* Baselines */}
      <CourtLine position={[0, lh, hl]} size={[COURT.width, lt]} />
      <CourtLine position={[0, lh, -hl]} size={[COURT.width, lt]} />

      {/* Doubles sidelines */}
      <CourtLine position={[hw, lh, 0]} size={[lt, COURT.length]} />
      <CourtLine position={[-hw, lh, 0]} size={[lt, COURT.length]} />

      {/* Singles sidelines */}
      <CourtLine position={[hsw, lh, 0]} size={[lt, COURT.length]} />
      <CourtLine position={[-hsw, lh, 0]} size={[lt, COURT.length]} />

      {/* Service lines */}
      <CourtLine position={[0, lh, sd]} size={[COURT.singlesWidth, lt]} />
      <CourtLine position={[0, lh, -sd]} size={[COURT.singlesWidth, lt]} />

      {/* Center service lines */}
      <CourtLine position={[0, lh, sd / 2]} size={[lt, sd]} />
      <CourtLine position={[0, lh, -sd / 2]} size={[lt, sd]} />

      {/* Center marks */}
      <CourtLine position={[0, lh, hl - 0.1]} size={[lt, 0.2]} />
      <CourtLine position={[0, lh, -hl + 0.1]} size={[lt, 0.2]} />
    </group>
  );
}
