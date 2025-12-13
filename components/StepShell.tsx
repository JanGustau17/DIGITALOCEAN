'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import roundGradientAnimation from './Round Gradient.json';

// Dynamically import LottieLayer to avoid SSR issues
const LottieLayer = dynamic(() => import('./ui/LottieLayer'), { 
  ssr: false,
  loading: () => null // Don't show anything while loading
});

interface StepShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  currentStep?: number;
  totalSteps?: number;
  phase?: 'Sense' | 'Support' | 'Act';
}

export default function StepShell({
  children,
  title,
  subtitle,
  onBack,
  showBack = false,
  currentStep,
  totalSteps,
  phase,
}: StepShellProps) {
  return (
    <div className="min-h-screen ambient-gradient flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient Lottie layer - optional, won't break if it fails */}
      {typeof window !== 'undefined' && (
        <LottieLayer 
          animationData={roundGradientAnimation} 
          opacity={0.15}
          className="lottie-breathe"
        />
      )}
      
      {/* Content container - centered column */}
      <div className="relative z-10 w-full max-w-[520px] flex flex-col">
        {/* Back button */}
        {showBack && onBack && (
          <motion.button
            onClick={onBack}
            className="absolute -top-12 left-0 sm:left-4 w-10 h-10 rounded-full glass flex items-center justify-center text-gray-600 hover:bg-white/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </motion.button>
        )}

        {/* Progress indicator */}
        {currentStep && totalSteps && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">
                Step {currentStep} of {totalSteps}
              </span>
              {phase && (
                <span className="text-xs text-gray-400 uppercase tracking-wider">
                  {phase}
                </span>
              )}
            </div>
            <div className="h-0.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#F9A32A] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Main card panel */}
        <motion.div
          className="glass rounded-3xl shadow-xl p-6 sm:p-8 relative z-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ minHeight: '200px' }}
        >
          {/* Title */}
          {title && (
            <motion.h1
              className="text-2xl sm:text-3xl font-light text-gray-800 mb-2 text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {title}
            </motion.h1>
          )}

          {/* Subtitle */}
          {subtitle && (
            <motion.p
              className="text-sm sm:text-base text-gray-500 mb-4 text-center font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {subtitle}
            </motion.p>
          )}

          {/* Main content */}
          <div className="w-full">
            {children}
          </div>
        </motion.div>

        {/* Footer safety text */}
        <motion.p
          className="mt-8 text-xs text-gray-400 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          If something feels unsafe, talk to a trusted adult.
        </motion.p>
      </div>
    </div>
  );
}
