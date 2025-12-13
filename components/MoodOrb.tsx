'use client';

import Lottie from 'lottie-react';
import roundGradientAnimation from './Round Gradient.json';
import blobAnimation from './Blob animation.json';
import lightBlueOrbitAnimation from './Light blue orbit.json';

interface MoodOrbProps {
  intensity: number; // 0-100
  words?: string[];
  size?: number;
}

export default function MoodOrb({ intensity, words = [], size = 300 }: MoodOrbProps) {
  // Intensity affects size
  const intensityScale = 0.7 + (intensity / 100) * 0.3;
  const animationSize = size * intensityScale;

  // Choose animation based on intensity
  const getAnimation = () => {
    if (intensity <= 33) {
      return lightBlueOrbitAnimation; // Calm - orbit animation
    } else if (intensity <= 66) {
      return roundGradientAnimation; // Balanced - round gradient
    } else {
      return blobAnimation; // Big feelings - blob animation
    }
  };

  const hasStormy = words.includes('stormy') || words.includes('stuck');

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Lottie Animation */}
      <div
        style={{
          width: animationSize,
          height: animationSize,
        }}
        className="relative"
      >
        <Lottie
          animationData={getAnimation()}
          loop={true}
          autoplay={true}
          style={{
            width: '100%',
            height: '100%',
            filter: hasStormy ? 'hue-rotate(10deg)' : 'none',
          }}
        />
      </div>
    </div>
  );
}

