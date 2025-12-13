'use client';

import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

interface SpeechButtonProps {
  isMuted: boolean;
  onToggle: () => void;
}

export default function SpeechButton({ isMuted, onToggle }: SpeechButtonProps) {
  return (
    <motion.button
      onClick={onToggle}
      className="fixed top-6 right-6 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors backdrop-blur-sm"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isMuted ? 'Unmute' : 'Mute'}
    >
      {isMuted ? (
        <VolumeX size={24} className="text-white/70" />
      ) : (
        <Volume2 size={24} className="text-white/70" />
      )}
    </motion.button>
  );
}

