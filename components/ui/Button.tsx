'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ButtonProps {
  onClick: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
  className = '',
  size = 'md',
}: ButtonProps) {
  const baseStyles = 'rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variantStyles = {
    primary: 'bg-[#F9A32A] text-white shadow-lg hover:shadow-xl hover:bg-[#E8931F] focus:ring-[#F9A32A] relative z-30 transition-colors',
    secondary: 'bg-white/80 backdrop-blur-md border border-gray-200 text-gray-800 hover:bg-white focus:ring-gray-400 relative z-30',
    ghost: 'bg-transparent text-gray-700 hover:bg-white/20 focus:ring-gray-400 relative z-30',
  };

  return (
    <motion.button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
          onClick();
        }
      }}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className} touch-manipulation`}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {children}
    </motion.button>
  );
}

