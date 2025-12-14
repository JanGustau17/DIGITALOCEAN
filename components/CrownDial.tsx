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
  const lastAngleRef = useRef<number | null>(null);
  
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
      lastAngleRef.current = null;
    }
  }, [value, isDragging, rotation]);

  const handleDragStart = () => {
    setIsDragging(true);
    lastAngleRef.current = null;
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Get current pointer position
    const clientX = 'touches' in event && event.touches.length > 0 
      ? event.touches[0].clientX 
      : 'clientX' in event 
        ? event.clientX 
        : centerX;
    const clientY = 'touches' in event && event.touches.length > 0 
      ? event.touches[0].clientY 
      : 'clientY' in event 
        ? event.clientY 
        : centerY;
    
    // Calculate angle from center (in radians, then convert to degrees)
    // atan2 gives angle from positive x-axis, we adjust to start from top (0° = top)
    const angleRad = Math.atan2(clientY - centerY, clientX - centerX);
    let angleDeg = (angleRad * 180) / Math.PI + 90; // +90 to start from top
    if (angleDeg < 0) angleDeg += 360;
    if (angleDeg >= 360) angleDeg -= 360;
    
    // Calculate rotation delta from last angle
    if (lastAngleRef.current !== null) {
      let delta = angleDeg - lastAngleRef.current;
      
      // Handle wrap-around (crossing 0/360 boundary)
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      
      const currentRot = rotation.get();
      const newRot = currentRot + delta;
      const normalizedRot = ((newRot % 360) + 360) % 360;
      
      rotation.set(normalizedRot);
      const newValue = rotationToValue(normalizedRot);
      onChange(Math.round(newValue));
    }
    
    lastAngleRef.current = angleDeg;
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    lastAngleRef.current = null;
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

  // Responsive size for mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const responsiveSize = isMobile ? Math.min(size, 200) : size;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center"
      style={{ 
        width: responsiveSize, 
        height: responsiveSize,
        pointerEvents: 'auto', // Allow interactions
      }}
      onWheel={handleWheel}
    >
      {/* Circular track */}
      <svg
        width={responsiveSize}
        height={responsiveSize}
        className="absolute"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background track */}
        <circle
          cx={responsiveSize / 2}
          cy={responsiveSize / 2}
          r={(responsiveSize - strokeWidth * 2) / 2}
          fill="none"
          stroke="rgba(0, 0, 0, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress track */}
        <motion.circle
          cx={responsiveSize / 2}
          cy={responsiveSize / 2}
          r={(responsiveSize - strokeWidth * 2) / 2}
          fill="none"
          stroke={getIntensityColor(value)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * ((responsiveSize - strokeWidth * 2) / 2)}
          style={{
            strokeDashoffset,
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        />
      </svg>

      {/* Draggable knob - only the visible knob, not the whole circle */}
      <motion.div
        className="absolute touch-manipulation"
        style={{
          top: strokeWidth,
          left: '50%',
          transform: 'translateX(-50%)',
          width: isMobile ? 36 : 40, // Larger touch target for easier interaction
          height: isMobile ? 36 : 40,
          borderRadius: '50%',
          background: getIntensityColor(value),
          boxShadow: `0 0 ${isMobile ? 12 : 16}px ${getIntensityColor(value)}80`,
          border: `${isMobile ? 3 : 3.5}px solid rgba(255, 255, 255, 0.9)`,
          zIndex: 15,
          pointerEvents: 'auto',
          cursor: 'grab',
          rotate: currentRotation,
        }}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.1 }}
        animate={{
          scale: isDragging ? 1.1 : 1,
        }}
      />

      {/* Center display */}
      <div 
        className="absolute flex flex-col items-center justify-center pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <motion.div
          className={`${isMobile ? 'text-3xl' : 'text-4xl sm:text-5xl'} font-light mb-1`}
          style={{ color: getIntensityColor(value) }}
          animate={{
            scale: isDragging ? 1.05 : 1,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {Math.round(value)}
        </motion.div>
        <div
          className={`${isMobile ? 'text-base' : 'text-lg sm:text-xl'} font-medium`}
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
