import { useEffect, useRef } from 'react';
import { Scene } from './components/Scene.tsx';
import { HUD } from './components/HUD.tsx';
import { GameEngine } from './game/engine.ts';
import { InputManager } from './game/input.ts';
import './App.css';

// Create once at module level — no async, no WASM
const engine = new GameEngine();
const input = new InputManager();

function App() {
  useEffect(() => {
    return () => {
      input.dispose();
      engine.dispose();
    };
  }, []);

  return (
    <div className="game-container">
      <HUD engine={engine} />
      <Scene engine={engine} input={input} />
    </div>
  );
}

export default App;
