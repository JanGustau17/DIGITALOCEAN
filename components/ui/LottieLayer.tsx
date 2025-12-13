'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface LottieLayerProps {
  animationData: any;
  opacity?: number;
  className?: string;
}

export default function LottieLayer({ animationData, opacity = 0.15, className = '' }: LottieLayerProps) {
  if (typeof window === 'undefined') return null;
  
  // Safety check - if Lottie fails to load, don't break the page
  if (!animationData) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <div className="w-full h-full flex items-center justify-center">
        <div 
          className="w-full h-full max-w-6xl max-h-6xl"
          style={{ opacity }}
        >
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}

