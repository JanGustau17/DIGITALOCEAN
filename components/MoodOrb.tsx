'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface MoodOrbProps {
  intensity: number; // 0-100
  words?: string[];
  size?: number;
}

export default function MoodOrb({ intensity, words = [], size = 300 }: MoodOrbProps) {
  const [noiseOffset, setNoiseOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setNoiseOffset(prev => (prev + 0.5) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Kid-friendly soft pastel colors by intensity
  const getColors = (intensity: number) => {
    if (intensity <= 33) {
      // Soft cool blue/teal - calm feelings
      return {
        center: '#A8DADC', // soft teal
        mid: '#89C2C4', // medium teal
        outer: '#6BA8AB', // deeper teal
        glow: '#C9E4E4', // light glow
      };
    } else if (intensity <= 66) {
      // Soft green/yellow - balanced feelings
      return {
        center: '#B8E0D2', // soft mint
        mid: '#9DD1C1', // medium mint
        outer: '#7FB8A6', // deeper mint
        glow: '#D4F4E4', // light glow
      };
    } else {
      // Soft orange/pink - big feelings
      return {
        center: '#FFD4C9', // soft coral
        mid: '#FFB8A8', // medium coral
        outer: '#FF9C87', // deeper coral
        glow: '#FFE4E0', // light glow
      };
    }
  };

  const colors = getColors(intensity);
  const hasStormy = words.includes('stormy') || words.includes('stuck');
  
  // Intensity affects size and glow
  const intensityScale = 0.7 + (intensity / 100) * 0.3;
  const glowIntensity = 0.3 + (intensity / 100) * 0.4;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer glow layers */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.9,
          height: size * 0.9,
          background: `radial-gradient(circle, ${colors.glow}${Math.round(glowIntensity * 100).toString(16)} 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.7,
          height: size * 0.7,
          background: `radial-gradient(circle, ${colors.mid}40 0%, transparent 60%)`,
          filter: 'blur(30px)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />

      {/* Main orb */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * intensityScale,
          height: size * intensityScale,
          background: `radial-gradient(circle at 30% 30%, ${colors.center}, ${colors.mid} 50%, ${colors.outer} 100%)`,
          boxShadow: `0 0 ${size * 0.3}px ${colors.glow}60, inset 0 0 ${size * 0.2}px ${colors.center}40`,
        }}
        animate={{
          scale: hasStormy ? [1, 1.02, 0.98, 1] : [1, 1.01, 1],
          rotate: hasStormy ? [0, 1, -1, 0] : 0,
        }}
        transition={{
          duration: hasStormy ? 2 : 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Subtle noise overlay */}
        <div
          className="absolute inset-0 rounded-full opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: '100% 100%',
            transform: `translate(${noiseOffset}px, ${noiseOffset}px)`,
          }}
        />
      </motion.div>

      {/* Inner bright core */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.2 * intensityScale,
          height: size * 0.2 * intensityScale,
          background: colors.center,
          filter: `blur(${size * 0.05}px)`,
          boxShadow: `0 0 ${size * 0.15}px ${colors.glow}`,
        }}
        animate={{
          opacity: [0.6, 1, 0.6],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

