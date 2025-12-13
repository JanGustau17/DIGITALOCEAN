'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Import all activity animations
import cuteDoggieAnimation from './Cute Doggie.json';
import happyAnimation from './Happy.json';
import huggingAnimation from './Hugging.json';
import sunriseAnimation from './Sunrise - Breathe in Breathe out.json';
import walkingBroccoliAnimation from './Walking Broccoli.json';
import yogaDogAnimation from './Yoga Dog.json';

interface ActivityAnimationProps {
  activityType?: string;
  words?: string[];
  size?: number;
}

export default function ActivityAnimation({ 
  activityType, 
  words = [], 
  size = 200 
}: ActivityAnimationProps) {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Select animation based on activity type and words
    let selectedAnimation = null;

    switch (activityType) {
      case 'breathing':
        selectedAnimation = sunriseAnimation;
        break;
      case 'movement':
        // Choose between yoga dog and walking broccoli based on words
        if (words.includes('tired') || words.includes('heavy')) {
          selectedAnimation = yogaDogAnimation; // Gentle movement
        } else {
          selectedAnimation = walkingBroccoliAnimation; // Active movement
        }
        break;
      case 'grounding':
        // Choose based on intensity/words
        if (words.includes('stormy') || words.includes('stuck')) {
          selectedAnimation = huggingAnimation; // Comforting
        } else {
          selectedAnimation = happyAnimation; // Positive
        }
        break;
      case 'focus':
        selectedAnimation = cuteDoggieAnimation;
        break;
      case 'creative':
        selectedAnimation = happyAnimation;
        break;
      default:
        // Default based on words
        if (words.includes('stormy') || words.includes('stuck')) {
          selectedAnimation = huggingAnimation;
        } else if (words.includes('tired') || words.includes('heavy')) {
          selectedAnimation = yogaDogAnimation;
        } else if (words.includes('excited') || words.includes('buzzy')) {
          selectedAnimation = walkingBroccoliAnimation;
        } else {
          selectedAnimation = happyAnimation;
        }
    }

    setAnimationData(selectedAnimation);
  }, [activityType, words]);

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

