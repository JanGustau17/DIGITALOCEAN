'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import StepShell from '@/components/StepShell';
import dynamic from 'next/dynamic';
import IntensitySlider from '@/components/IntensitySlider';
import SpeechButton from '@/components/SpeechButton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LottieHero from '@/components/LottieHero';
import ActivityAnimation from '@/components/ActivityAnimation';
import ActivitySteps from '@/components/ActivitySteps';
import PageAnimation from '@/components/PageAnimation';
import { SessionState, AgentResponse, StructuredActivityResponse } from '@/lib/types';
import { saveEntry } from '@/lib/storage';
import { speak, stopSpeaking, setSpeechStateCallback } from '@/lib/elevenlabs';
import { getActivityPosterPlaceholder } from '@/lib/openaiImages';

// Words with soft gradient palettes and emojis
const WORDS = [
  { text: 'calm', emoji: '😌', gradient: 'from-blue-100 via-cyan-100 to-teal-100' },
  { text: 'buzzy', emoji: '⚡', gradient: 'from-yellow-100 via-amber-100 to-orange-100' },
  { text: 'heavy', emoji: '💭', gradient: 'from-indigo-100 via-blue-100 to-purple-100' },
  { text: 'wiggly', emoji: '🐛', gradient: 'from-pink-100 via-rose-100 to-red-100' },
  { text: 'okay', emoji: '👍', gradient: 'from-gray-100 via-slate-100 to-zinc-100' },
  { text: 'tired', emoji: '😴', gradient: 'from-slate-100 via-gray-100 to-stone-100' },
  { text: 'excited', emoji: '🎉', gradient: 'from-orange-100 via-amber-100 to-yellow-100' },
  { text: 'stuck', emoji: '🧱', gradient: 'from-red-100 via-rose-100 to-pink-100' },
  { text: 'smooth', emoji: '🌊', gradient: 'from-purple-100 via-violet-100 to-fuchsia-100' },
  { text: 'stormy', emoji: '⛈️', gradient: 'from-gray-200 via-slate-200 to-zinc-200' },
];

const IMPACTS = [
  { text: 'school', emoji: '🏫', gradient: 'from-blue-100 via-indigo-100 to-purple-100' },
  { text: 'friends', emoji: '👫', gradient: 'from-pink-100 via-rose-100 to-orange-100' },
  { text: 'home', emoji: '🏠', gradient: 'from-purple-100 via-pink-100 to-fuchsia-100' },
  { text: 'my body', emoji: '💪', gradient: 'from-green-100 via-emerald-100 to-teal-100' },
  { text: 'something else', emoji: '🤔', gradient: 'from-gray-100 via-slate-100 to-zinc-100' },
  { text: 'not sure', emoji: '🤷', gradient: 'from-violet-100 via-purple-100 to-indigo-100' },
];

const FALLBACK_ACTIVITIES = [
  { text: 'Take 3 big, slow breaths. Breathe in like you\'re smelling a flower, hold it, then breathe out like you\'re blowing out birthday candles!', type: 'breathing' },
  { text: 'Look around you and name 5 things you can see. What colors are they?', type: 'grounding' },
  { text: 'Stand up and stretch your arms way up high like you\'re reaching for the stars! Then shake your hands and wiggle your body.', type: 'movement' },
  { text: 'Count backwards from 10 slowly, like you\'re counting down to a rocket launch!', type: 'focus' },
  { text: 'Draw a quick doodle or write one word about how you feel. It can be anything!', type: 'creative' },
];

// Step configuration
const STEP_CONFIG: Record<string, { step: number; phase?: 'Sense' | 'Support' | 'Act' }> = {
  intro: { step: 0 },
  intensity: { step: 1, phase: 'Sense' },
  words: { step: 2, phase: 'Sense' },
  impact: { step: 3, phase: 'Sense' },
  support: { step: 4, phase: 'Support' },
  closing: { step: 5 },
};

const TOTAL_STEPS = 5;

export default function CheckInPage() {
  const router = useRouter();
  const [step, setStep] = useState<'intro' | 'intensity' | 'words' | 'impact' | 'support' | 'closing'>('intro');
  const [intensity, setIntensity] = useState(50);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [impact, setImpact] = useState<string | null>(null);
  const [currentActivity, setCurrentActivity] = useState<{ text: string; type: string } | null>(null);
  const [structuredActivity, setStructuredActivity] = useState<StructuredActivityResponse | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [variationNonce, setVariationNonce] = useState<string>('');
  const [previousTitles, setPreviousTitles] = useState<string[]>([]);
  const [activityImage, setActivityImage] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  
  // Client-side cache for activity images (keyed by variationNonce)
  const imageCacheRef = useRef<Map<string, string>>(new Map());
  
  // Load image from cache or localStorage
  const getCachedImage = (nonce: string): string | null => {
    // Check in-memory cache first
    if (imageCacheRef.current.has(nonce)) {
      return imageCacheRef.current.get(nonce)!;
    }
    
    // Check localStorage
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`activity_image_${nonce}`);
      if (cached) {
        imageCacheRef.current.set(nonce, cached);
        return cached;
      }
    }
    
    return null;
  };
  
  // Save image to cache
  const setCachedImage = (nonce: string, imageUrl: string): void => {
    imageCacheRef.current.set(nonce, imageUrl);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`activity_image_${nonce}`, imageUrl);
    }
  };
  // Load mute state from localStorage
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('unpack_muted');
      return saved === 'true';
    }
    return false;
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set up speech state callback
  useEffect(() => {
    setSpeechStateCallback((speaking: boolean) => {
      setIsSpeaking(speaking);
    });
  }, []);

  // Voice disabled - no auto-speak, no blocking behavior
  // Voice system exists but is inactive - UI flow is uninterrupted

  useEffect(() => {
    if (step === 'support' && !structuredActivity && !isLoadingActivity) {
      loadActivity(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Generate UUID for variation nonce
  const generateNonce = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const loadActivity = async (regenerate = false) => {
    setIsLoadingActivity(true);
      setIsLoadingImage(true);
    
    // Generate new nonce for this request
    const newNonce = generateNonce();
    setVariationNonce(newNonce);
    
    // Clear image immediately when regenerating
    if (regenerate) {
      setActivityImage(null);
    }
    
    const sessionState: SessionState = {
      intensity,
      words: selectedWords,
      impact,
      step: 'support',
    };

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionSoFar: sessionState,
          regenerate,
          variationNonce: newNonce,
          previousTitles: previousTitles.slice(-3), // Keep last 3 titles
        }),
        cache: 'no-store', // Prevent caching
      });

      if (!response.ok) {
        throw new Error('Failed to load activity');
      }

      const data: AgentResponse = await response.json();
      
      if (data.skip) {
        handleSkip();
        return;
      }

      // API now always returns structured response
      if (data.structured) {
        // Debug log (dev only)
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.log('📦 Structured Activity Response:', {
            title: data.structured.activityTitle,
            type: data.structured.activityType,
            variationNonce: newNonce.substring(0, 8),
            steps: data.structured.steps.map(s => ({
              instruction: s.instruction,
              imagePrompt: s.imagePrompt.substring(0, 50) + '...',
            })),
          });
        }
        
        setStructuredActivity(data.structured);
        setCurrentActivity(null); // Clear legacy format
        
        // Add to previous titles
        setPreviousTitles(prev => [...prev.slice(-2), data.structured.activityTitle]);
        
        // Use placeholder immediately if not cached
        const placeholderImage = (data as any).activityImage || getActivityPosterPlaceholder();
        const cachedImage = getCachedImage(newNonce);
        if (!cachedImage) {
          setActivityImage(placeholderImage);
        } else {
          setActivityImage(cachedImage);
        }
        
        // If image is being generated, load it progressively
        if ((data as any).generatingImage && data.structured.steps && !cachedImage) {
          // Set timeout (15s)
          const timeoutId = setTimeout(() => {
            console.warn('⏱️ Image generation timeout, keeping placeholder');
            setIsLoadingImage(false);
          }, 15000);
          
          // Generate single poster image
          fetch('/api/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              steps: data.structured.steps.map((s: any) => ({ instruction: s.instruction })),
              variationNonce: newNonce,
              activityType: data.structured.activityType,
            }),
            cache: 'no-store',
          })
            .then(response => {
              clearTimeout(timeoutId);
              if (response.ok) {
                return response.json();
              }
              throw new Error('Failed to generate image');
            })
            .then(imageData => {
              if (imageData.imageUrl) {
                setActivityImage(imageData.imageUrl);
                setCachedImage(newNonce, imageData.imageUrl);
                console.log('✅ Activity poster loaded');
              }
              setIsLoadingImage(false);
            })
            .catch(error => {
              clearTimeout(timeoutId);
              console.error('Failed to load activity poster:', error);
              setIsLoadingImage(false);
              // Keep placeholder on error
            });
        } else {
          setIsLoadingImage(false);
        }
      } else {
        // Fallback (shouldn't happen, but just in case)
        console.warn('No structured response, using fallback');
        const fallback = FALLBACK_ACTIVITIES[parseInt(newNonce.substring(0, 2), 16) % FALLBACK_ACTIVITIES.length];
        setStructuredActivity(null);
        setCurrentActivity(fallback);
        setActivityImage(null);
      }
    } catch (error) {
      console.error('Error loading activity:', error);
      // Fallback to hardcoded activity
      const fallbackNonce = variationNonce || generateNonce();
      const fallback = FALLBACK_ACTIVITIES[parseInt(fallbackNonce.substring(0, 2), 16) % FALLBACK_ACTIVITIES.length];
      setStructuredActivity(null);
      setCurrentActivity(fallback);
      setActivityImage(null);
    } finally {
      setIsLoadingActivity(false);
      // Don't set here - let image loading handle it
    }
  };

  const handleNext = () => {
    stopSpeaking();
    
    if (step === 'intensity') {
      setStep('words');
    } else if (step === 'words') {
      setStep('impact');
    } else if (step === 'impact') {
      setStep('support');
      setCurrentActivity(null);
      setStructuredActivity(null);
      setVariationNonce('');
      setPreviousTitles([]);
      setActivityImage(null);
    } else if (step === 'support') {
      // Save entry and move to closing
      saveEntry({
        intensity,
        words: selectedWords,
        impact,
        activityType: structuredActivity?.activityType || currentActivity?.type || null,
      });
      setStep('closing');
    }
  };

  const handleSkip = () => {
    stopSpeaking();
    
    if (step === 'words' || step === 'impact') {
      handleNext();
    } else if (step === 'support') {
      // Skip support step - save and move to closing
      saveEntry({
        intensity,
        words: selectedWords,
        impact,
        activityType: structuredActivity?.activityType || currentActivity?.type || null,
      });
      setStep('closing');
    }
  };

  const toggleWord = (word: string) => {
    // Voice disabled - no blocking
    
    setSelectedWords(prev =>
      prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]
    );
  };

  const config = STEP_CONFIG[step];

  return (
    <div className="min-h-screen">
      <SpeechButton isMuted={isMuted} onToggle={() => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        if (typeof window !== 'undefined') {
          localStorage.setItem('unpack_muted', String(newMuted));
        }
        if (!newMuted) {
          stopSpeaking();
        }
      }} />
      
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <StepShell 
              title="How are you feeling?"
              subtitle="Let&apos;s check in together"
              showBack={false}
            >
              <div className="flex flex-col items-center gap-6 w-full">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <PageAnimation step="intro" size={140} />
                </motion.div>
                <div className="w-full flex justify-center pt-2">
                  <Button 
                    onClick={() => {
                      stopSpeaking();
                      setTimeout(() => {
                        setStep('intensity');
                      }, 200);
                    }}
                    className="w-full max-w-xs touch-manipulation"
                  >
                    Let&apos;s Begin
                  </Button>
                </div>
              </div>
            </StepShell>
          </motion.div>
        )}

        {step === 'intensity' && (
          <motion.div
            key="intensity"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <StepShell
              title="How big is this feeling?"
              subtitle="Turn the dial to show me"
              showBack
              onBack={() => {
                stopSpeaking();
                setStep('intro');
              }}
              currentStep={config.step}
              totalSteps={TOTAL_STEPS}
              phase={config.phase}
            >
              <div className="flex flex-col items-center gap-6 w-full">
                <PageAnimation step="intensity" intensity={intensity} size={120} />
                <IntensitySlider value={intensity} onChange={setIntensity} />
                <div className="w-full flex flex-col items-center gap-4 pt-4">
                  <Button 
                    onClick={() => {
                      if (!isProcessing) {
                        stopSpeaking();
                        handleNext();
                      }
                    }} 
                    disabled={isProcessing}
                    className="w-full max-w-xs touch-manipulation"
                    size="md"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </StepShell>
          </motion.div>
        )}

        {step === 'words' && (
          <motion.div
            key="words"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <StepShell
              title="Do any words fit?"
              subtitle="Tap the ones that feel right"
              showBack
              onBack={() => {
                stopSpeaking();
                setStep('intensity');
              }}
              currentStep={config.step}
              totalSteps={TOTAL_STEPS}
              phase={config.phase}
            >
              <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 w-full">
                <PageAnimation step="words" intensity={intensity} words={selectedWords} size={100} />
                <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full">
                  {WORDS.map(word => {
                    const isSelected = selectedWords.includes(word.text);
                    return (
                      <motion.button
                        key={word.text}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isSpeaking) {
                            toggleWord(word.text);
                          }
                        }}
                        disabled={false}
                        className={`px-4 py-3 m-1 rounded-2xl font-medium text-base transition-all relative overflow-hidden flex items-center justify-center gap-2 ${
                          false 
                            ? 'opacity-50 cursor-wait bg-white/60 text-gray-500'
                            : isSelected
                            ? `text-gray-800 shadow-md ring-2 ring-blue-400/50 bg-gradient-to-br ${word.gradient}`
                            : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-md shadow-sm border border-gray-200'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="text-xl">{word.emoji}</span>
                        <span className="relative z-10">{word.text}</span>
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex gap-3 w-full pt-2">
                  <Button onClick={handleNext} disabled={isProcessing || isSpeaking} className="flex-1">
                    Done
                  </Button>
                  <Button onClick={handleSkip} variant="secondary" disabled={isProcessing || isSpeaking} size="sm">
                    Skip
                  </Button>
                </div>
              </div>
            </StepShell>
          </motion.div>
        )}

        {step === 'impact' && (
          <motion.div
            key="impact"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <StepShell
              title="What&apos;s making you feel this way?"
              subtitle="Pick what feels most true"
              showBack
              onBack={() => {
                stopSpeaking();
                setStep('words');
              }}
              currentStep={config.step}
              totalSteps={TOTAL_STEPS}
              phase={config.phase}
            >
              <div className="flex flex-col items-center gap-6 w-full">
                <PageAnimation step="impact" intensity={intensity} words={selectedWords} size={100} />
                <div className="grid grid-cols-2 gap-3 w-full">
                  {IMPACTS.map(imp => {
                    const isSelected = impact === imp.text;
                    return (
                      <motion.button
                        key={imp.text}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isSpeaking) return;
                          stopSpeaking();
                          setImpact(imp.text);
                          setTimeout(() => handleNext(), 300);
                        }}
                        disabled={false}
                        className={`px-4 py-4 m-1 rounded-2xl font-medium text-base transition-all relative overflow-hidden flex items-center justify-center gap-2 ${
                          false
                            ? 'opacity-50 cursor-wait bg-white/60 text-gray-500'
                            : isSelected
                            ? `text-gray-800 shadow-md ring-2 ring-purple-400/50 bg-gradient-to-br ${imp.gradient}`
                            : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-md shadow-sm border border-gray-200'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="text-xl">{imp.emoji}</span>
                        <span className="relative z-10">{imp.text}</span>
                      </motion.button>
                    );
                  })}
                </div>
                <div className="w-full flex justify-center pt-2">
                  <Button 
                    onClick={() => {
                      if (!isProcessing) {
                        stopSpeaking();
                        handleSkip();
                      }
                    }} 
                    variant="secondary" 
                    disabled={isProcessing}
                    className="w-full max-w-xs touch-manipulation"
                  >
                    Skip
                  </Button>
                </div>
              </div>
            </StepShell>
          </motion.div>
        )}

        {step === 'support' && (
          <motion.div
            key="support"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <StepShell 
              title="Let&apos;s try something fun!"
              subtitle="This might help you feel better"
              showBack
              onBack={() => {
                stopSpeaking();
                setStep('impact');
              }}
              currentStep={config.step}
              totalSteps={TOTAL_STEPS}
              phase={config.phase}
            >
              <div className="flex flex-col items-center gap-6 w-full">
                {isLoadingActivity ? (
                  <div className="text-gray-500 text-base sm:text-lg">Loading something fun...</div>
                ) : structuredActivity ? (
                  <>
                    {/* Structured 3-step activity */}
                    <ActivitySteps 
                      activity={structuredActivity} 
                      activityImage={activityImage}
                      isLoadingImage={isLoadingImage}
                      variationNonce={variationNonce}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-6">
                      <Button 
                        onClick={() => {
                          if (!isProcessing) {
                            stopSpeaking();
                            handleNext();
                          }
                        }} 
                        disabled={isProcessing || isSpeaking || isLoadingActivity} 
                        className="w-full touch-manipulation whitespace-nowrap h-12 min-w-[120px] px-5 text-sm sm:text-base font-medium"
                      >
                        Try it
                      </Button>
                      <Button 
                        onClick={() => {
                          stopSpeaking();
                          loadActivity(true); // Regenerate with new idea
                        }} 
                        variant="secondary" 
                        disabled={isProcessing || isSpeaking || isLoadingActivity}
                        className="w-full touch-manipulation whitespace-nowrap h-12 min-w-[120px] px-5 text-sm sm:text-base font-medium"
                        size="sm"
                      >
                        {isLoadingActivity ? 'Loading...' : 'New idea'}
                      </Button>
                      <Button 
                        onClick={() => {
                          if (!isProcessing) {
                            stopSpeaking();
                            handleSkip();
                          }
                        }} 
                        variant="secondary" 
                        disabled={isProcessing || isSpeaking || isLoadingActivity}
                        className="w-full touch-manipulation whitespace-nowrap h-12 min-w-[120px] px-5 text-sm sm:text-base font-medium"
                        size="sm"
                      >
                        Skip
                      </Button>
                    </div>
                  </>
                ) : currentActivity ? (
                  <>
                    {/* Legacy format fallback */}
                    <ActivityAnimation 
                      activityType={currentActivity.type}
                      words={selectedWords}
                      size={140}
                    />
                    
                    <Card padding="md" className="w-full mb-4">
                      <p className="text-sm sm:text-base md:text-lg text-gray-700 text-center leading-relaxed">
                        {currentActivity.text}
                      </p>
                    </Card>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                      <Button 
                        onClick={() => {
                          if (!isProcessing) {
                            stopSpeaking();
                            handleNext();
                          }
                        }} 
                        disabled={isProcessing} 
                        className="w-full touch-manipulation whitespace-nowrap h-12 min-w-[100px] px-4 text-sm sm:text-base"
                      >
                        Try it
                      </Button>
                      <Button 
                        onClick={() => {
                          stopSpeaking();
                          loadActivity(true); // Regenerate
                        }} 
                        variant="secondary" 
                        disabled={isProcessing || isSpeaking || isLoadingActivity}
                        className="w-full touch-manipulation whitespace-nowrap h-12 min-w-[100px] px-4 text-sm sm:text-base"
                        size="sm"
                      >
                        {isLoadingActivity ? 'Loading...' : 'New idea'}
                      </Button>
                      <Button 
                        onClick={() => {
                          if (!isProcessing) {
                            stopSpeaking();
                            handleSkip();
                          }
                        }} 
                        variant="secondary" 
                        disabled={isProcessing}
                        className="w-full touch-manipulation whitespace-nowrap h-12 min-w-[100px] px-4 text-sm sm:text-base"
                        size="sm"
                      >
                        Skip
                      </Button>
                    </div>
                  </>
                ) : null}
              </div>
            </StepShell>
          </motion.div>
        )}

        {step === 'closing' && (
          <motion.div
            key="closing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <StepShell 
              title="You did amazing!"
              subtitle="I&apos;m so proud of you"
            >
              <div className="flex flex-col items-center gap-6 w-full">
                <PageAnimation step="closing" intensity={intensity} words={selectedWords} size={140} />
                <div className="w-full flex justify-center pt-2">
                  <Button 
                    onClick={() => {
                      if (!isProcessing) {
                        router.push('/history');
                      }
                    }} 
                    disabled={isProcessing}
                    className="w-full max-w-xs touch-manipulation"
                  >
                    See My History
                  </Button>
                </div>
                </div>
                <motion.p
                  className="text-base text-gray-500 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Great job checking in today!
                </motion.p>
            </StepShell>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
