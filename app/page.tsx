'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import StepShell from '@/components/StepShell';
import dynamic from 'next/dynamic';
import CrownDial from '@/components/CrownDial';
import SpeechButton from '@/components/SpeechButton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LottieHero from '@/components/LottieHero';
import ActivityAnimation from '@/components/ActivityAnimation';
import PageAnimation from '@/components/PageAnimation';
import { SessionState, AgentResponse } from '@/lib/types';
import { saveEntry } from '@/lib/storage';
import { speak, stopSpeaking, setSpeechStateCallback } from '@/lib/elevenlabs';

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
  const [activityIndex, setActivityIndex] = useState(0);
  const [currentActivity, setCurrentActivity] = useState<{ text: string; type: string } | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set up speech state callback
  useEffect(() => {
    setSpeechStateCallback((speaking: boolean) => {
      setIsSpeaking(speaking);
    });
  }, []);

  // Auto-speak when step changes
  useEffect(() => {
    if (isMuted) {
      stopSpeaking();
      return;
    }

    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }

    stopSpeaking();

    speechTimeoutRef.current = setTimeout(() => {
      let textToSpeak = '';

      switch (step) {
        case 'intro':
          textToSpeak = "How are you feeling? Let's check in together.";
          break;
        case 'intensity':
          textToSpeak = "How big is this feeling? Turn the dial to show me.";
          break;
        case 'words':
          textToSpeak = "Do any words fit? Tap the ones that feel right.";
          break;
        case 'impact':
          textToSpeak = "What's making you feel this way? Pick what feels most true.";
          break;
        case 'support':
          textToSpeak = "Let's try something fun! This might help you feel better.";
          break;
        case 'closing':
          textToSpeak = "You did amazing! I'm so proud of you.";
          break;
      }

      if (textToSpeak && !isMuted) {
        speak(textToSpeak, { rate: 0.75, pitch: 1.15 }).catch(err => {
          console.log('Speech error (non-blocking):', err);
        });
      }
    }, 500);

    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, [step, isMuted]);

  useEffect(() => {
    if (step === 'support' && activityIndex < 3 && !currentActivity && !isLoadingActivity) {
      loadActivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, activityIndex]);

  const loadActivity = async () => {
    setIsLoadingActivity(true);
    
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
        body: JSON.stringify({ sessionSoFar: sessionState }),
      });

      if (response.ok) {
        const data: AgentResponse = await response.json();
        if (data.skip) {
          setActivityIndex(prev => prev + 1);
          setIsLoadingActivity(false);
          return;
        }
        setCurrentActivity({
          text: data.activityText,
          type: data.activityType,
        });
      } else {
        throw new Error('Agent failed');
      }
    } catch (error) {
      const fallback = FALLBACK_ACTIVITIES[activityIndex % FALLBACK_ACTIVITIES.length];
      setCurrentActivity(fallback);
    } finally {
      setIsLoadingActivity(false);
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
      setActivityIndex(0);
      setCurrentActivity(null);
    } else if (step === 'support') {
      if (activityIndex < 2) {
        setActivityIndex(prev => prev + 1);
        setCurrentActivity(null);
      } else {
        saveEntry({
          intensity,
          words: selectedWords,
          impact,
          activityType: currentActivity?.type || null,
        });
        setStep('closing');
      }
    }
  };

  const handleSkip = () => {
    stopSpeaking();
    
    if (step === 'words' || step === 'impact') {
      handleNext();
    } else if (step === 'support') {
      if (activityIndex < 2) {
        setActivityIndex(prev => prev + 1);
        setCurrentActivity(null);
      } else {
        saveEntry({
          intensity,
          words: selectedWords,
          impact,
          activityType: null,
        });
        setStep('closing');
      }
    }
  };

  const toggleWord = (word: string) => {
    if (isSpeaking) return;
    
    setSelectedWords(prev =>
      prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]
    );
  };

  const config = STEP_CONFIG[step];

  return (
    <div className="min-h-screen">
      <SpeechButton isMuted={isMuted} onToggle={() => {
        setIsMuted(!isMuted);
        if (!isMuted) {
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
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <PageAnimation step="intro" size={200} />
                </motion.div>
                <Button 
                  onClick={() => {
                    stopSpeaking();
                    setTimeout(() => {
                      setStep('intensity');
                    }, 200);
                  }}
                >
                  Let&apos;s Begin
                </Button>
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
              <div className="flex flex-col items-center gap-4">
                <PageAnimation step="intensity" intensity={intensity} size={180} />
                <CrownDial value={intensity} onChange={setIntensity} size={200} />
                <Button 
                  onClick={() => {
                    if (!isProcessing && !isSpeaking) {
                      handleNext();
                    }
                  }} 
                  disabled={isProcessing || isSpeaking}
                  className="w-full max-w-xs"
                >
                  Continue
                </Button>
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
              <div className="flex flex-col items-center gap-4">
                <PageAnimation step="words" intensity={intensity} words={selectedWords} size={160} />
                <div className="grid grid-cols-2 gap-3 w-full">
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
                        disabled={isSpeaking}
                        className={`px-4 py-3 m-1 rounded-2xl font-medium text-base transition-all relative overflow-hidden flex items-center justify-center gap-2 ${
                          isSpeaking 
                            ? 'opacity-50 cursor-wait bg-white/60 text-gray-500'
                            : isSelected
                            ? `text-gray-800 shadow-md ring-2 ring-blue-400/50 bg-gradient-to-br ${word.gradient}`
                            : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-md shadow-sm border border-gray-200'
                        }`}
                        whileHover={isSpeaking ? {} : { scale: 1.02 }}
                        whileTap={isSpeaking ? {} : { scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="text-xl">{word.emoji}</span>
                        <span className="relative z-10">{word.text}</span>
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex gap-3 w-full">
                  <Button onClick={handleNext} disabled={isProcessing || isSpeaking} className="flex-1">
                    Done
                  </Button>
                  <Button onClick={handleSkip} variant="secondary" disabled={isProcessing || isSpeaking}>
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
              <div className="flex flex-col items-center gap-4">
                <PageAnimation step="impact" intensity={intensity} words={selectedWords} size={160} />
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
                        disabled={isSpeaking}
                        className={`px-4 py-4 m-1 rounded-2xl font-medium text-base transition-all relative overflow-hidden flex items-center justify-center gap-2 ${
                          isSpeaking
                            ? 'opacity-50 cursor-wait bg-white/60 text-gray-500'
                            : isSelected
                            ? `text-gray-800 shadow-md ring-2 ring-purple-400/50 bg-gradient-to-br ${imp.gradient}`
                            : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-md shadow-sm border border-gray-200'
                        }`}
                        whileHover={isSpeaking ? {} : { scale: 1.02 }}
                        whileTap={isSpeaking ? {} : { scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="text-xl">{imp.emoji}</span>
                        <span className="relative z-10">{imp.text}</span>
                      </motion.button>
                    );
                  })}
                </div>
                <Button onClick={handleSkip} variant="secondary" disabled={isProcessing || isSpeaking}>
                  Skip
                </Button>
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
              <div className="flex flex-col items-center gap-3">
                {isLoadingActivity ? (
                  <div className="text-gray-500 text-lg">Loading something fun...</div>
                ) : currentActivity ? (
                  <>
                    {/* Activity Animation - fills the gap */}
                    <ActivityAnimation 
                      activityType={currentActivity.type}
                      words={selectedWords}
                      size={200}
                    />
                    
                    <Card padding="lg" className="w-full">
                      <p className="text-lg text-gray-700 text-center leading-relaxed">
                        {currentActivity.text}
                      </p>
                    </Card>
                    <div className="flex gap-3 w-full flex-wrap">
                      <Button onClick={handleNext} disabled={isProcessing || isSpeaking} className="flex-1 min-w-[120px]">
                        I&apos;ll Try It
                      </Button>
                      <Button 
                        onClick={() => {
                          stopSpeaking();
                          setCurrentActivity(null);
                          if (activityIndex < 2) {
                            setActivityIndex(prev => prev + 1);
                          } else {
                            loadActivity();
                          }
                        }} 
                        variant="secondary" 
                        disabled={isProcessing || isSpeaking}
                      >
                        Different one
                      </Button>
                      <Button onClick={handleSkip} variant="secondary" disabled={isProcessing || isSpeaking}>
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
              <div className="flex flex-col items-center gap-4">
                <PageAnimation step="closing" intensity={intensity} words={selectedWords} size={200} />
                <Button onClick={() => router.push('/history')} disabled={isProcessing}>
                  See My History
                </Button>
                <motion.p
                  className="text-base text-gray-500 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Great job checking in today!
                </motion.p>
              </div>
            </StepShell>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
