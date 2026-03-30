import { useState, useEffect } from 'react';
import type { GameEngine } from '../game/engine.ts';

interface HUDProps {
  engine: GameEngine;
  showCrosshair?: boolean;
}

export function HUD({ engine, showCrosshair = true }: HUDProps) {
  const [rally, setRally] = useState(0);
  const [best, setBest] = useState(0);
  const [info, setInfo] = useState(engine.infoText);

  useEffect(() => {
    return engine.subscribe(() => {
      setRally(engine.rallyCount);
      setBest(engine.bestRally);
      setInfo(engine.infoText);
    });
  }, [engine]);

  return (
    <>
      <div className="hud">
        <div className="hud-score">Rally: {rally} | Best: {best}</div>
        <div className="hud-info">{info}</div>
      </div>
      {showCrosshair && <div className="crosshair" />}
    </>
  );
}
