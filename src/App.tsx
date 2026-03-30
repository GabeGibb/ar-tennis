import { useEffect } from 'react';
import { Scene } from './components/Scene.tsx';
import { HUD } from './components/HUD.tsx';
import { GameEngine } from './game/engine.ts';
import { DesktopInputProvider } from './game/desktop-input.ts';
import './App.css';

const engine = new GameEngine();
const inputProvider = new DesktopInputProvider();

function App() {
  useEffect(() => {
    return () => {
      inputProvider.dispose();
      engine.dispose();
    };
  }, []);

  return (
    <div className="game-container">
      <HUD engine={engine} showCrosshair={true} />
      <Scene engine={engine} inputProvider={inputProvider} />
    </div>
  );
}

export default App;
