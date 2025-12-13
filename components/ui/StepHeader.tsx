'use client';

import { motion } from 'framer-motion';

interface StepHeaderProps {
  title: string;
  subtitle?: string;
}

export default function StepHeader({ title, subtitle }: StepHeaderProps) {
  return (
    <div className="text-center mb-8">
      <motion.h1
        className="text-2xl sm:text-3xl font-light text-gray-800 mb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p
          className="text-sm sm:text-base text-gray-500 font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

