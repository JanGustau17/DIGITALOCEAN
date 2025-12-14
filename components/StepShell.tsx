'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import roundGradientAnimation from './Round Gradient.json';

// Dynamically import LottieLayer to avoid SSR issues
const LottieLayer = dynamic(() => import('./ui/LottieLayer'), { 
  ssr: false,
  loading: () => null
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
    <div className="min-h-screen ambient-gradient flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      {/* Ambient Lottie layer */}
      {typeof window !== 'undefined' && (
        <LottieLayer 
          animationData={roundGradientAnimation} 
          opacity={0.15}
          className="lottie-breathe"
        />
      )}
      
      {/* Content container */}
      <div className="relative z-10 w-full max-w-md flex flex-col flex-1 justify-center py-6">
        {/* Fixed-height header row - prevents overlap */}
        <div className="h-16 sm:h-20 flex items-center justify-between mb-4 sm:mb-6 px-2 relative">
          {/* Left: Back button - fixed width container */}
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-start">
            {showBack && onBack && (
              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBack();
                }}
                className="w-10 h-10 rounded-full glass flex items-center justify-center text-gray-600 hover:bg-white/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </motion.button>
            )}
          </div>

          {/* Center: Step indicator - flexible, centered */}
          {currentStep && totalSteps && (
            <div className="flex-1 px-2 sm:px-4 flex flex-col items-center justify-center min-w-0">
              <span className="text-xs sm:text-sm text-gray-500 font-medium mb-1 whitespace-nowrap">
                Step {currentStep} of {totalSteps}
              </span>
              <div className="h-0.5 w-full max-w-[200px] bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#F9A32A] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Right: Phase label - fixed width container */}
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-end">
            {phase && (
              <span className="text-xs text-gray-400 uppercase tracking-wider hidden sm:inline whitespace-nowrap">
                {phase}
              </span>
            )}
          </div>
        </div>

        {/* Main card panel */}
        <motion.div
          className="glass rounded-3xl shadow-xl p-6 sm:p-8 relative z-20 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Title */}
          {title && (
            <motion.h1
              className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-2 text-center"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 1.875rem)' }}
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
              className="text-sm sm:text-base text-gray-500 mb-6 text-center font-light"
              style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}
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
      </div>
    </div>
  );
}
