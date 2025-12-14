'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';

interface CrownDialProps {
  value: number; // 0-100
  onChange: (value: number) => void;
  size?: number;
}

export default function CrownDial({ value, onChange, size = 240 }: CrownDialProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
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

  // Calculate knob position from rotation
  const getKnobPosition = useCallback((rot: number) => {
    const responsiveSize = typeof window !== 'undefined' && window.innerWidth < 640 
      ? Math.min(size, 200) 
      : size;
    const strokeWidth = 6;
    const radius = (responsiveSize - strokeWidth * 2) / 2;
    const centerX = responsiveSize / 2;
    const centerY = responsiveSize / 2;
    
    // Convert rotation to radians
    // Rotation 0° = top (12 o'clock), so we subtract 90° to align with standard math coordinates
    // Then convert to radians
    const angleRad = ((rot - 90) * Math.PI) / 180;
    
    // Calculate knob position on circle (standard trigonometry)
    // cos/sin give us the position relative to center
    const knobX = centerX + radius * Math.cos(angleRad);
    const knobY = centerY + radius * Math.sin(angleRad);
    
    return { x: knobX, y: knobY };
  }, [size]);

  const knobPosition = useTransform(rotation, (rot) => getKnobPosition(rot));

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!containerRef.current || !knobRef.current) return;
    
    e.preventDefault();
    setIsDragging(true);
    lastAngleRef.current = null;
    knobRef.current.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate angle from center
    const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
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
  }, [isDragging, rotation, onChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (knobRef.current) {
      knobRef.current.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    lastAngleRef.current = null;
  }, []);

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

  // Keyboard accessibility
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
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const responsiveSize = isMobile ? Math.min(size, 200) : size;
  const radius = (responsiveSize - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = useTransform(rotation, (r) => {
    const val = rotationToValue(r);
    return circumference - (val / 100) * circumference;
  });

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center"
      style={{ 
        width: responsiveSize, 
        height: responsiveSize,
      }}
      onWheel={handleWheel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="slider"
      aria-label="Intensity dial"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-orientation="vertical"
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
          r={radius}
          fill="none"
          stroke="rgba(0, 0, 0, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress track */}
        <motion.circle
          cx={responsiveSize / 2}
          cy={responsiveSize / 2}
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

      {/* Draggable knob - positioned using calculated coordinates */}
      <motion.div
        ref={knobRef}
        className="absolute touch-manipulation focus:outline-none focus:ring-2 focus:ring-[#F9A32A] focus:ring-offset-2 rounded-full"
        style={{
          width: isMobile ? 32 : 36,
          height: isMobile ? 32 : 36,
          borderRadius: '50%',
          background: getIntensityColor(value),
          boxShadow: `0 0 ${isMobile ? 12 : 16}px ${getIntensityColor(value)}80`,
          border: `${isMobile ? 3 : 3.5}px solid rgba(255, 255, 255, 0.9)`,
          zIndex: 15,
          pointerEvents: 'auto',
          cursor: 'grab',
          x: useTransform(knobPosition, (pos) => pos.x - (isMobile ? 16 : 18)),
          y: useTransform(knobPosition, (pos) => pos.y - (isMobile ? 16 : 18)),
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
        animate={{
          scale: isDragging ? 1.1 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
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
          transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.08 }}
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
