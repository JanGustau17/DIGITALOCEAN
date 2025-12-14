'use client';

import { motion } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';

interface IntensitySliderProps {
  value: number; // 0-100
  onChange: (value: number) => void;
}

export default function IntensitySlider({ value, onChange }: IntensitySliderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const getIntensityLabel = (val: number): string => {
    if (val < 25) return 'Low';
    if (val < 50) return 'Medium';
    if (val < 75) return 'High';
    return 'Big';
  };

  const getIntensityColor = (val: number): string => {
    if (val < 33) return '#A8DADC'; // soft teal
    if (val < 66) return '#B8E0D2'; // soft mint
    return '#FFD4C9'; // soft coral
  };

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    onChange(newValue);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const step = e.shiftKey ? 5 : 1;
      onChange(Math.max(0, value - step));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.shiftKey ? 5 : 1;
      onChange(Math.min(100, value + step));
    }
  }, [value, onChange]);

  const color = getIntensityColor(value);
  const label = getIntensityLabel(value);

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-6">
      {/* Large number display */}
      <motion.div
        className="flex flex-col items-center gap-2"
        animate={{
          scale: isDragging ? 1.05 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div
          className="text-6xl sm:text-7xl font-light"
          style={{ color }}
        >
          {Math.round(value)}
        </div>
        <div
          className="text-xl sm:text-2xl font-medium"
          style={{ color }}
        >
          {label}
        </div>
      </motion.div>

      {/* Slider */}
      <div className="w-full relative">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={handleSliderChange}
          onKeyDown={handleKeyDown}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer touch-manipulation focus:outline-none focus:ring-2 focus:ring-[#F9A32A] focus:ring-offset-2"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${value}%, rgba(0, 0, 0, 0.1) ${value}%, rgba(0, 0, 0, 0.1) 100%)`,
          }}
          aria-label="Intensity slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
        />
        {/* Custom slider thumb styling */}
        <style dangerouslySetInnerHTML={{
          __html: `
            input[type="range"]::-webkit-slider-thumb {
              appearance: none;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: ${color};
              border: 3px solid white;
              box-shadow: 0 0 12px ${color}80;
              cursor: grab;
              transition: transform 0.2s;
            }
            input[type="range"]::-webkit-slider-thumb:active {
              cursor: grabbing;
              transform: scale(1.2);
            }
            input[type="range"]::-moz-range-thumb {
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: ${color};
              border: 3px solid white;
              box-shadow: 0 0 12px ${color}80;
              cursor: grab;
              transition: transform 0.2s;
            }
            input[type="range"]::-moz-range-thumb:active {
              cursor: grabbing;
              transform: scale(1.2);
            }
          `
        }} />
      </div>

      {/* Helper text */}
      {!isDragging && (
        <motion.p
          className="text-xs text-gray-400 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Drag or use arrow keys to adjust
        </motion.p>
      )}
    </div>
  );
}

