'use client';

import { motion } from 'framer-motion';

interface ProgressProps {
  current: number;
  total: number;
  phase?: 'Sense' | 'Support' | 'Act';
}

export default function Progress({ current, total, phase }: ProgressProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-medium">
          Step {current} of {total}
        </span>
        {phase && (
          <span className="text-xs text-gray-400 uppercase tracking-wider">
            {phase}
          </span>
        )}
      </div>
      <div className="h-1 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

