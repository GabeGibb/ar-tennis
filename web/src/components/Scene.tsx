import { useRef, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Ground } from './Ground.tsx';
import { Wall } from './Wall.tsx';
import { Court } from './Court.tsx';
import { Ball } from './Ball.tsx';
import { Racket } from './Racket.tsx';
import { GameEngine } from '../game/engine.ts';
import type { InputProvider, PlayerInput } from '../game/input-provider.ts';
import { PHYSICS, PLAYER } from '../game/constants.ts';

interface GameLoopProps {
  engine: GameEngine;
  inputProvider: InputProvider;
}

function CameraController({ engine, inputProvider }: GameLoopProps) {
  const { camera } = useThree();
  const accumulator = useRef(0);
  const latestInput = useRef<PlayerInput | null>(null);

  useFrame((_, delta) => {
    const cappedDelta = Math.min(delta, 0.05);
    accumulator.current += cappedDelta;

    let firstStep = true;
    while (accumulator.current >= PHYSICS.fixedTimeStep) {
      inputProvider.update(PHYSICS.fixedTimeStep);
      const input = inputProvider.getInput();
      // Only use one-shot flags (swing/serve) on the first sub-step
      if (!firstStep) {
        input.swing = false;
        input.serve = false;
      }
      engine.step(input);
      latestInput.current = input;
      firstStep = false;
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
  inputProvider: InputProvider;
}

export function Scene({ engine, inputProvider }: SceneProps) {
  const handleCanvasClick = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (inputProvider.requestPointerLock && !inputProvider.isLocked && canvas) {
      inputProvider.requestPointerLock(canvas);
    } else if (inputProvider.onClick) {
      inputProvider.onClick();
    }
  }, [inputProvider]);

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
      <Court />
      <Wall />
      <Ball ballState={engine.ballState} />
      <Racket engine={engine} />

      <CameraController engine={engine} inputProvider={inputProvider} />
    </Canvas>
  );
}
