'use client';

import { motion, useMotionValue, PanInfo } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface CrownDialProps {
  value: number; // 0-100
  onChange: (value: number) => void;
  size?: number;
}

export default function CrownDial({ value, onChange, size = 320 }: CrownDialProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rotation = useMotionValue(0);
  
  // Map value (0-100) to rotation (-180 to 180 degrees)
  const valueToRotation = (val: number) => (val / 100) * 360 - 180;
  const rotationToValue = (rot: number) => {
    const normalized = ((rot + 180) % 360 + 360) % 360;
    return Math.max(0, Math.min(100, (normalized / 360) * 100));
  };

  useEffect(() => {
    rotation.set(valueToRotation(value));
  }, [value, rotation]);

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const delta = info.delta.x + info.delta.y;
    const currentRot = rotation.get();
    const newRot = currentRot + delta * 0.5; // Sensitivity
    rotation.set(newRot);
    onChange(rotationToValue(newRot));
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -5 : 5;
    const currentRot = rotation.get();
    const newRot = currentRot + delta;
    rotation.set(newRot);
    onChange(rotationToValue(newRot));
  };

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

  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center"
      style={{ width: size, height: size }}
      onWheel={handleWheel}
    >
      {/* Circular track */}
      <svg
        width={size}
        height={size}
        className="absolute"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress track */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getIntensityColor(value)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{
            strokeDashoffset,
            filter: 'blur(2px)',
          }}
          animate={{
            strokeDashoffset,
          }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </svg>

      {/* Draggable ring */}
      <motion.div
        className="absolute cursor-grab active:cursor-grabbing"
        style={{
          width: size,
          height: size,
          rotate: rotation,
        }}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDrag={handleDrag}
        onDragEnd={() => setIsDragging(false)}
        whileDrag={{ scale: 1.05 }}
      >
        {/* Knob/handle */}
        <div
          className="absolute"
          style={{
            top: strokeWidth / 2,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: getIntensityColor(value),
            boxShadow: `0 0 20px ${getIntensityColor(value)}80`,
            border: '3px solid rgba(255, 255, 255, 0.9)',
          }}
        />
      </motion.div>

      {/* Center display */}
      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
        <motion.div
          className="text-6xl font-light mb-2"
          style={{ color: getIntensityColor(value) }}
          animate={{
            scale: isDragging ? 1.1 : 1,
          }}
        >
          {Math.round(value)}
        </motion.div>
        <div
          className="text-2xl font-medium"
          style={{ color: getIntensityColor(value) }}
        >
          {getIntensityLabel(value)}
        </div>
      </div>

      {/* Scroll hint */}
      {!isDragging && (
        <motion.div
          className="absolute -bottom-8 text-sm text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Scroll or drag to adjust
        </motion.div>
      )}
    </div>
  );
}

