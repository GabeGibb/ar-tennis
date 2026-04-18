import { COURT } from '../game/constants.ts';

function CourtLine({ position, size }: { position: [number, number, number]; size: [number, number] }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={size} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  );
}

/** Half-court lines for wall practice mode */
export function Court() {
  const hsw = COURT.singlesWidth / 2;
  const hl = COURT.halfLength;
  const sd = COURT.serviceDepth;
  const lt = 0.05; // line thickness
  const lh = 0.003; // line height above court

  return (
    <group>
      {/* Blue hard court surface (half court) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, hl / 2]} receiveShadow>
        <planeGeometry args={[COURT.singlesWidth, hl]} />
        <meshStandardMaterial color="#1a6bc4" roughness={0.7} />
      </mesh>

      {/* Baseline (back of half court) */}
      <CourtLine position={[0, lh, hl]} size={[COURT.singlesWidth, lt]} />

      {/* Singles sidelines (wall to baseline) */}
      <CourtLine position={[hsw, lh, hl / 2]} size={[lt, hl]} />
      <CourtLine position={[-hsw, lh, hl / 2]} size={[lt, hl]} />

      {/* Service line */}
      <CourtLine position={[0, lh, sd]} size={[COURT.singlesWidth, lt]} />

      {/* Center service line (wall to service line) */}
      <CourtLine position={[0, lh, sd / 2]} size={[lt, sd]} />

      {/* Center mark on baseline */}
      <CourtLine position={[0, lh, hl - 0.1]} size={[lt, 0.2]} />
    </group>
  );
}
