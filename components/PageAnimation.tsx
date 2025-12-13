'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Import all animations
import cuteDoggieAnimation from './Cute Doggie.json';
import happyAnimation from './Happy.json';
import huggingAnimation from './Hugging.json';
import sunriseAnimation from './Sunrise - Breathe in Breathe out.json';
import walkingBroccoliAnimation from './Walking Broccoli.json';
import yogaDogAnimation from './Yoga Dog.json';
import relaxingLoaderAnimation from './Relaxing Loader.json';

interface PageAnimationProps {
  step: 'intro' | 'intensity' | 'words' | 'impact' | 'support' | 'closing';
  intensity?: number;
  words?: string[];
  size?: number;
}

export default function PageAnimation({ 
  step, 
  intensity = 50,
  words = [],
  size = 200 
}: PageAnimationProps) {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Select animation based on step
    let selectedAnimation = null;

    switch (step) {
      case 'intro':
        // Intro page - use Relaxing Loader (welcoming)
        selectedAnimation = relaxingLoaderAnimation;
        break;
      case 'intensity':
        // Intensity page - use Walking Broccoli (energetic, matches dial interaction)
        selectedAnimation = walkingBroccoliAnimation;
        break;
      case 'words':
        // Words page - use Hugging (emotions, connection)
        selectedAnimation = huggingAnimation;
        break;
      case 'impact':
        // Impact page - use Cute Doggie (friendly, approachable)
        selectedAnimation = cuteDoggieAnimation;
        break;
      case 'support':
        // Support page - use ActivityAnimation component instead (handled separately)
        // This won't be used, but keeping for consistency
        selectedAnimation = happyAnimation;
        break;
      case 'closing':
        // Closing page - use Happy (celebration, positive)
        selectedAnimation = happyAnimation;
        break;
      default:
        selectedAnimation = happyAnimation;
    }

    setAnimationData(selectedAnimation);
  }, [step]);

  if (typeof window === 'undefined' || !animationData) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className="flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-50"
      />
    );
  }

  return (
    <div 
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div style={{ width: '100%', height: '100%' }}>
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}

