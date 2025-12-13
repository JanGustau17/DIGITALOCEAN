'use client';

import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

interface MoodMascot3DProps {
  intensity?: number;
  size?: number;
}

function MascotModel({ intensity = 50 }: { intensity?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/girl_and_blob.glb');
  const { actions } = useAnimations(animations, groupRef);

  // Play first animation if available
  useEffect(() => {
    if (animations.length > 0 && actions) {
      const action = actions[animations[0].name];
      if (action) {
        action.reset().fadeIn(0.5).play();
        return () => {
          action.fadeOut(0.5);
        };
      }
    }
  }, [animations, actions]);

  // Gentle float animation - more pronounced
  useFrame((state) => {
    if (groupRef.current) {
      // More visible up/down float
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.15;
      // Subtle rotation
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
    }
  });

  return (
    <group ref={groupRef} scale={[1.2, 1.2, 1.2]}>
      <primitive object={scene} />
    </group>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#E0F4F4" opacity={0.5} transparent />
    </mesh>
  );
}

export default function MoodMascot3D({ intensity = 50, size = 300 }: MoodMascot3DProps) {
  return (
    <div style={{ width: size, height: size }} className="relative z-20">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Enhanced lighting for better character visibility */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} color="#ffffff" />
          <directionalLight position={[-5, 3, -5]} intensity={0.6} color="#e0f4ff" />
          <pointLight position={[0, 6, 3]} intensity={0.8} color="#fff9e6" />
          <pointLight position={[0, -2, 0]} intensity={0.4} color="#f0e6ff" />
          
          {/* Mascot */}
          <MascotModel intensity={intensity} />
          
          {/* Disable orbit controls for fixed view */}
          <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}

