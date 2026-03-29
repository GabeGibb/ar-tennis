import { useRef, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Ground } from './Ground.tsx';
import { Wall } from './Wall.tsx';
import { Ball } from './Ball.tsx';
import { Racket } from './Racket.tsx';
import { GameEngine } from '../game/engine.ts';
import { InputManager } from '../game/input.ts';
import { PHYSICS, PLAYER } from '../game/constants.ts';

interface GameLoopProps {
  engine: GameEngine;
  input: InputManager;
}

function CameraController({ engine, input }: GameLoopProps) {
  const { camera } = useThree();
  const accumulator = useRef(0);

  useFrame((_, delta) => {
    const cappedDelta = Math.min(delta, 0.05);
    accumulator.current += cappedDelta;

    // Consume input ONCE per frame
    const inputState = input.consume();

    while (accumulator.current >= PHYSICS.fixedTimeStep) {
      engine.step(inputState);
      // Clear one-shot flags after first sub-step
      inputState.swing = false;
      inputState.serve = false;
      accumulator.current -= PHYSICS.fixedTimeStep;
    }

    const player = engine.playerState;
    camera.position.set(player.position.x, player.position.y, player.position.z);
    camera.rotation.set(0, 0, 0);
    camera.rotateY(player.yaw);
    camera.rotateX(player.pitch);
  });

  return null;
}

interface SceneProps {
  engine: GameEngine;
  input: InputManager;
}

export function Scene({ engine, input }: SceneProps) {
  const handleCanvasClick = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!document.pointerLockElement && canvas) {
      input.requestPointerLock(canvas);
    } else {
      input.onClick();
    }
  }, [input]);

  return (
    <Canvas
      shadows
      onClick={handleCanvasClick}
      camera={{
        fov: 75,
        near: 0.1,
        far: 200,
        position: [0, PLAYER.eyeHeight, 8],
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
    >
      <color attach="background" args={['#87ceeb']} />

      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      <Ground />
      <Wall />
      <Ball ballState={engine.ballState} />
      <Racket engine={engine} />

      <CameraController engine={engine} input={input} />
    </Canvas>
  );
}
