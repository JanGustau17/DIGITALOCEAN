'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface StepShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  gradient?: string;
}

export default function StepShell({
  children,
  title,
  subtitle,
  onBack,
  showBack = false,
  gradient = 'from-blue-50 via-purple-50 to-pink-50',
}: StepShellProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden`}>
      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        {/* Back button */}
        {showBack && onBack && (
          <motion.button
            onClick={onBack}
            className="fixed top-4 left-4 sm:top-6 sm:left-6 bg-white/80 backdrop-blur-sm text-gray-600 p-2 sm:p-3 rounded-full hover:scale-110 transition-all duration-300 shadow-md z-10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Go back"
          >
            <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
          </motion.button>
        )}

        {/* Title */}
        {title && (
          <motion.h1
            className="text-3xl sm:text-5xl font-light text-gray-700 mb-2 sm:mb-4 text-center px-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {title}
          </motion.h1>
        )}

        {/* Subtitle */}
        {subtitle && (
          <motion.p
            className="text-lg sm:text-2xl text-gray-500 mb-8 sm:mb-12 text-center font-light px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {subtitle}
          </motion.p>
        )}

        {/* Main content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={title}
            className="w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer safety text */}
      <motion.div
        className="absolute bottom-4 sm:bottom-6 left-0 right-0 text-center px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-xs sm:text-sm text-gray-400">
          If something feels unsafe, talk to a trusted adult.
        </p>
      </motion.div>
    </div>
  );
}
