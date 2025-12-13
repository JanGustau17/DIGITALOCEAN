'use client';

import dynamic from 'next/dynamic';

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

import blobAnimation from './Blob animation.json';
import roundGradientAnimation from './Round Gradient.json';
import lightBlueOrbitAnimation from './Light blue orbit.json';
import relaxingLoaderAnimation from './Relaxing Loader.json';

interface LottieHeroProps {
  intensity?: number;
  step?: 'intro' | 'intensity' | 'words' | 'impact' | 'support' | 'closing';
  size?: number;
}

export default function LottieHero({ intensity = 50, step = 'intro', size = 240 }: LottieHeroProps) {
  if (typeof window === 'undefined') {
    return <div style={{ width: size, height: size }} className="flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-50" />;
  }

  // Only show Relaxing Loader on intro/welcome page
  if (step !== 'intro') {
    // Return empty space for all other pages
    return <div style={{ width: size, height: size }} className="flex items-center justify-center" />;
  }

  // Show Relaxing Loader only on intro page
  return (
    <div 
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div style={{ width: '100%', height: '100%' }}>
        <Lottie
          animationData={relaxingLoaderAnimation}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}

