'use client';

import { motion } from 'framer-motion';
import { StructuredActivityResponse } from '@/lib/types';
import { useState, useEffect } from 'react';
import { getActivityPosterPlaceholder } from '@/lib/openaiImages';

interface ActivityStepsProps {
  activity: StructuredActivityResponse;
  activityImage?: string | null; // Single collage poster image
  isLoadingImage?: boolean;
  variationNonce?: string; // For cache-busting
}

// Strip "Step X:" prefixes from instruction text
function cleanInstruction(text: string): string {
  return text
    .replace(/^Step\s*\d+\s*:\s*/i, '') // Remove "Step 1: " or "Step 1:"
    .replace(/^Step\s*\d+\s*/i, '') // Remove "Step 1 " (without colon)
    .trim();
}

export default function ActivitySteps({ 
  activity, 
  activityImage = null, 
  isLoadingImage = false,
  variationNonce = '' 
}: ActivityStepsProps) {
  const [displayImage, setDisplayImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Always show placeholder immediately
    const placeholder = getActivityPosterPlaceholder();
    setDisplayImage(activityImage || placeholder);
    setImageLoaded(!!activityImage && !activityImage.includes('svg+xml'));
  }, [activityImage]);

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Title */}
      <div className="text-center px-2">
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
          {activity.activityTitle}
        </h3>
        {activity.subtitle && (
          <p className="text-sm sm:text-base text-gray-500 font-normal">
            {activity.subtitle}
          </p>
        )}
      </div>

      {/* Single Poster Image */}
      <div className="w-full max-w-4xl">
        <div className="relative bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 rounded-3xl p-4 sm:p-6 overflow-hidden border border-gray-100/50 shadow-sm">
          {/* Loading overlay */}
          {isLoadingImage && !imageLoaded && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-3xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F9A32A] mx-auto mb-3"></div>
                <p className="text-sm text-gray-600 font-medium">Creating your picture...</p>
              </div>
            </div>
          )}
          
          {/* Poster Image */}
          {displayImage && (
            <motion.img
              src={displayImage}
              alt={`${activity.activityTitle} - Activity poster`}
              className="w-full h-auto rounded-2xl shadow-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: imageLoaded ? 1 : 0.7 }}
              transition={{ duration: 0.5 }}
              onLoad={() => {
                setImageLoaded(true);
              }}
              loading="lazy"
            />
          )}
        </div>
      </div>

      {/* 3 Steps List */}
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {activity.steps.map((step, index) => {
          const cleanedInstruction = cleanInstruction(step.instruction);
          
          return (
            <motion.div
              key={`${step.instruction}-${index}-${variationNonce}`}
              className="relative bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-3xl p-4 sm:p-5 flex flex-col items-center gap-3 min-h-[180px] sm:min-h-[200px] shadow-sm border border-gray-100/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Step number bubble above card */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#F9A32A] text-white flex items-center justify-center font-bold text-lg shadow-md z-10">
                {index + 1}
              </div>
              
              {/* Instruction - centered */}
              <p className="text-sm sm:text-base text-gray-700 text-center font-medium leading-relaxed flex-1 flex items-center justify-center pt-4">
                {cleanedInstruction}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
