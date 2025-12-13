'use client';

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface CrownDialProps {
  value: number; // 0-100
  onChange: (value: number) => void;
  size?: number;
}

export default function CrownDial({ value, onChange, size = 240 }: CrownDialProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rotation = useMotionValue(valueToRotation(value));
  
  // Map value (0-100) to rotation (0 to 360 degrees, starting from top)
  function valueToRotation(val: number): number {
    return (val / 100) * 360;
  }
  
  function rotationToValue(rot: number): number {
    // Normalize rotation to 0-360
    const normalized = ((rot % 360) + 360) % 360;
    return Math.max(0, Math.min(100, (normalized / 360) * 100));
  }

  // Sync rotation when value changes externally
  useEffect(() => {
    if (!isDragging) {
      rotation.set(valueToRotation(value));
    }
  }, [value, isDragging]);

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Calculate rotation based on drag delta (circular motion)
    const currentRot = rotation.get();
    
    // Calculate angle from center for circular dragging
    const deltaX = info.delta.x;
    const deltaY = info.delta.y;
    
    // Convert cartesian delta to angular rotation
    // Negative deltaY (up) = increase, positive deltaY (down) = decrease
    // Positive deltaX (right) = increase, negative deltaX (left) = decrease
    const angleDelta = -(deltaX + deltaY) * 0.5; // Combine both axes, negative for natural feel
    
    const newRot = currentRot + angleDelta;
    const normalizedRot = ((newRot % 360) + 360) % 360;
    
    rotation.set(normalizedRot);
    const newValue = rotationToValue(normalizedRot);
    onChange(Math.round(newValue));
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -2 : 2; // Scroll down decreases, scroll up increases
    const currentRot = rotation.get();
    const newRot = currentRot + delta;
    const normalizedRot = ((newRot % 360) + 360) % 360;
    rotation.set(normalizedRot);
    
    const newValue = rotationToValue(normalizedRot);
    onChange(Math.round(newValue));
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

  const strokeWidth = 6;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const currentRotation = useTransform(rotation, (r) => r);
  const strokeDashoffset = useTransform(rotation, (r) => {
    const val = rotationToValue(r);
    return circumference - (val / 100) * circumference;
  });

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
          stroke="rgba(0, 0, 0, 0.1)"
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
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        />
      </svg>

      {/* Draggable area - full circle for easier interaction */}
      <motion.div
        className="absolute cursor-grab active:cursor-grabbing"
        style={{
          width: size,
          height: size,
          rotate: currentRotation,
          zIndex: 10,
        }}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDrag={handleDrag}
        onDragEnd={() => {
          setIsDragging(false);
        }}
        whileDrag={{ scale: 1.01 }}
      >
        {/* Knob/handle */}
        <motion.div
          className="absolute"
          style={{
            top: strokeWidth,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: getIntensityColor(value),
            boxShadow: `0 0 16px ${getIntensityColor(value)}80`,
            border: '2.5px solid rgba(255, 255, 255, 0.9)',
            zIndex: 20,
          }}
          animate={{
            scale: isDragging ? 1.15 : 1,
          }}
        />
      </motion.div>

      {/* Center display */}
      <div 
        className="absolute flex flex-col items-center justify-center pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <motion.div
          className="text-4xl sm:text-5xl font-light mb-1"
          style={{ color: getIntensityColor(value) }}
          animate={{
            scale: isDragging ? 1.05 : 1,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {Math.round(value)}
        </motion.div>
        <div
          className="text-lg sm:text-xl font-medium"
          style={{ color: getIntensityColor(value) }}
        >
          {getIntensityLabel(value)}
        </div>
      </div>

      {/* Scroll hint */}
      {!isDragging && (
        <motion.div
          className="absolute -bottom-8 text-xs text-gray-400 text-center"
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
