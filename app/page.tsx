'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import StepShell from '@/components/StepShell';
import MoodOrb from '@/components/MoodOrb';
import CrownDial from '@/components/CrownDial';
import SpeechButton from '@/components/SpeechButton';
import { SessionState, AgentResponse } from '@/lib/types';
import { saveEntry } from '@/lib/storage';
import { speak, stopSpeaking } from '@/lib/elevenlabs';

// Kid-friendly words
const WORDS = [
  { text: 'calm', emoji: '😌', color: '#E0F4F4' },
  { text: 'buzzy', emoji: '⚡', color: '#FFF9B3' },
  { text: 'heavy', emoji: '😔', color: '#D4E4FF' },
  { text: 'wiggly', emoji: '🎉', color: '#FFE4E0' },
  { text: 'okay', emoji: '🙂', color: '#E8E8E8' },
  { text: 'tired', emoji: '😴', color: '#E8E8E8' },
  { text: 'excited', emoji: '🤗', color: '#FFE9E0' },
  { text: 'stuck', emoji: '😤', color: '#FFE0E0' },
  { text: 'smooth', emoji: '✨', color: '#E8E0FF' },
  { text: 'stormy', emoji: '⛈️', color: '#FFD0D0' },
];

const IMPACTS = [
  { text: 'school', emoji: '📚', color: '#E0F4F4' },
  { text: 'friends', emoji: '🤝', color: '#FFE4E0' },
  { text: 'home', emoji: '🏠', color: '#FFE0F7' },
  { text: 'my body', emoji: '💪', color: '#E0FFE9' },
  { text: 'something else', emoji: '🤷', color: '#F0F0F0' },
  { text: 'not sure', emoji: '🤔', color: '#E8E0FF' },
];

const FALLBACK_ACTIVITIES = [
  { text: 'Take 3 big, slow breaths. Breathe in like you\'re smelling a flower, hold it, then breathe out like you\'re blowing out birthday candles!', type: 'breathing' },
  { text: 'Look around you and name 5 things you can see. What colors are they?', type: 'grounding' },
  { text: 'Stand up and stretch your arms way up high like you\'re reaching for the stars! Then shake your hands and wiggle your body.', type: 'movement' },
  { text: 'Count backwards from 10 slowly, like you\'re counting down to a rocket launch!', type: 'focus' },
  { text: 'Draw a quick doodle or write one word about how you feel. It can be anything!', type: 'creative' },
];

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
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-speak when step changes - kid-friendly messages
  useEffect(() => {
    if (isMuted) return;

    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }

    stopSpeaking();

    speechTimeoutRef.current = setTimeout(() => {
      let textToSpeak = '';

      switch (step) {
        case 'intro':
          textToSpeak = "Hi there! Ready to check in with how you're feeling? Tap the button when you're ready to start!";
          break;
        case 'intensity':
          textToSpeak = "How big is this feeling? Turn the dial or scroll to show me. You can make it bigger or smaller!";
          break;
        case 'words':
          textToSpeak = "Do any of these words feel right? Tap the ones that match how you're feeling. You can pick more than one!";
          break;
        case 'impact':
          textToSpeak = "What's making you feel this way? Pick what feels most true for you right now.";
          break;
        case 'support':
          if (currentActivity) {
            textToSpeak = currentActivity.text;
          } else {
            textToSpeak = "Let's try something fun together! This might help you feel a little better.";
          }
          break;
        case 'closing':
          textToSpeak = "You did such a great job checking in! I'm proud of you. You can see your history if you want!";
          break;
      }

      if (textToSpeak) {
        speak(textToSpeak, { rate: 0.75, pitch: 1.15 });
      }
    }, 300);

    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, [step, isMuted, currentActivity]);

  // Speak when activity loads
  useEffect(() => {
    if (step === 'support' && currentActivity && !isMuted) {
      setTimeout(() => {
        speak(currentActivity.text, { rate: 0.75, pitch: 1.15 });
      }, 500);
    }
  }, [currentActivity, step, isMuted]);

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

  const handleWithDelay = async (callback: () => void, speechText?: string) => {
    if (isProcessing) {
      console.log('Already processing, ignoring click');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      if (speechText && !isMuted) {
        speak(speechText, { rate: 0.75, pitch: 1.15 }).catch((err) => {
          console.log('Speech failed, continuing...', err);
        });
        // Don't wait for speech, just start it
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      callback();
    } catch (error) {
      console.error('Error in handleWithDelay:', error);
    } finally {
      // Reset processing state after a short delay
      setTimeout(() => {
        setIsProcessing(false);
      }, 100);
    }
  };

  const handleNext = () => {
    if (step === 'intensity') {
      handleWithDelay(() => setStep('words'), "Great! Let's pick some words now.");
    } else if (step === 'words') {
      handleWithDelay(() => setStep('impact'), "Nice choices! Now let's see what's making you feel this way.");
    } else if (step === 'impact') {
      handleWithDelay(() => {
        setStep('support');
        setActivityIndex(0);
        setCurrentActivity(null);
      }, "Thanks for sharing! Let's try something fun together.");
    } else if (step === 'support') {
      if (activityIndex < 2) {
        handleWithDelay(() => {
          setActivityIndex(prev => prev + 1);
          setCurrentActivity(null);
        });
      } else {
        saveEntry({
          intensity,
          words: selectedWords,
          impact,
          activityType: currentActivity?.type || null,
        });
        handleWithDelay(() => setStep('closing'), "You did amazing! All done!");
      }
    }
  };

  const handleSkip = () => {
    if (step === 'words' || step === 'impact') {
      handleNext();
    } else if (step === 'support') {
      if (activityIndex < 2) {
        handleWithDelay(() => {
          setActivityIndex(prev => prev + 1);
          setCurrentActivity(null);
        });
      } else {
        saveEntry({
          intensity,
          words: selectedWords,
          impact,
          activityType: null,
        });
        handleWithDelay(() => setStep('closing'), "All done! Great job!");
      }
    }
  };

  const toggleWord = (word: string) => {
    setSelectedWords(prev =>
      prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]
    );
    if (!isMuted) {
      const wordObj = WORDS.find(w => w.text === word);
      speak(`You picked ${word}!`, { rate: 0.75, pitch: 1.15 });
    }
  };

  const Button = ({ onClick, children, variant = 'primary', disabled, emoji }: { onClick: () => void; children: React.ReactNode; variant?: 'primary' | 'secondary'; disabled?: boolean; emoji?: string }) => {
    const isButtonDisabled = disabled || isProcessing;
    
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Button clicked, disabled:', isButtonDisabled, 'isProcessing:', isProcessing);
      if (!isButtonDisabled && onClick) {
        onClick();
      }
    };
    
    return (
      <motion.button
        onClick={handleClick}
        disabled={isButtonDisabled}
        className={`px-8 py-4 rounded-full font-medium text-lg transition-colors relative z-10 cursor-pointer ${
          variant === 'primary'
            ? 'bg-gradient-to-r from-blue-300 to-purple-300 text-white hover:from-blue-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-md'
            : 'bg-white/70 text-gray-700 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'
        }`}
        whileHover={isButtonDisabled ? {} : { scale: 1.05 }}
        whileTap={isButtonDisabled ? {} : { scale: 0.95 }}
      >
        {emoji && <span className="mr-2">{emoji}</span>}
        {children}
      </motion.button>
    );
  };

  return (
    <>
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
              subtitle="Let's check in together"
              gradient="from-blue-50 via-purple-50 to-pink-50"
            >
              <div className="flex flex-col items-center gap-8">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-6xl mb-4"
                >
                  👋
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <MoodOrb intensity={50} size={200} />
                </motion.div>
                <Button 
                  onClick={() => {
                    console.log('Let\'s Begin clicked!');
                    handleWithDelay(() => {
                      console.log('Setting step to intensity');
                      setStep('intensity');
                    }, "Awesome! Let's get started!");
                  }} 
                  emoji="🌟"
                >
                  Let's Begin!
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
              gradient="from-yellow-50 via-pink-50 to-purple-50"
            >
              <div className="flex flex-col items-center gap-12">
                <CrownDial value={intensity} onChange={setIntensity} />
                <Button onClick={handleNext} disabled={isProcessing} emoji="✅">All Done!</Button>
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
              gradient="from-green-50 via-blue-50 to-indigo-50"
            >
              <div className="flex flex-col items-center gap-8">
                <div className="grid grid-cols-2 gap-4 w-full relative z-10">
                  {WORDS.map(word => (
                    <motion.button
                      key={word.text}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWord(word.text);
                      }}
                      className={`px-6 py-4 rounded-2xl font-medium text-lg transition-all backdrop-blur-sm relative z-10 ${
                        selectedWords.includes(word.text)
                          ? 'bg-white text-gray-700 shadow-md'
                          : 'bg-white/70 text-gray-600 hover:bg-white/90 shadow-sm'
                      }`}
                      style={selectedWords.includes(word.text) ? {
                        background: `linear-gradient(135deg, ${word.color} 0%, white 100%)`
                      } : {}}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl">{word.emoji}</span>
                        <span>{word.text}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <div className="flex gap-4">
                  <Button onClick={handleNext} disabled={isProcessing} emoji="✅">Done!</Button>
                  <Button onClick={handleSkip} variant="secondary" disabled={isProcessing}>Skip</Button>
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
              title="What's making you feel this way?"
              subtitle="Pick what feels most true"
              showBack
              onBack={() => {
                stopSpeaking();
                setStep('words');
              }}
              gradient="from-indigo-50 via-purple-50 to-pink-50"
            >
              <div className="flex flex-col items-center gap-8">
                <div className="grid grid-cols-2 gap-4 w-full relative z-10">
                  {IMPACTS.map(imp => (
                    <motion.button
                      key={imp.text}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setImpact(imp.text);
                        if (!isMuted) {
                          speak(`You picked ${imp.text}!`, { rate: 0.75, pitch: 1.15 }).catch(() => {});
                        }
                        setTimeout(() => handleNext(), 400);
                      }}
                      className={`px-6 py-4 rounded-2xl font-medium text-lg transition-all backdrop-blur-sm relative z-10 ${
                        impact === imp.text
                          ? 'bg-white text-gray-700 shadow-md'
                          : 'bg-white/70 text-gray-600 hover:bg-white/90 shadow-sm'
                      }`}
                      style={impact === imp.text ? {
                        background: `linear-gradient(135deg, ${imp.color} 0%, white 100%)`
                      } : {}}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl">{imp.emoji}</span>
                        <span>{imp.text}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <Button onClick={handleSkip} variant="secondary" disabled={isProcessing}>Skip</Button>
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
              title="Let's try something fun!"
              subtitle="This might help you feel better"
              gradient="from-purple-50 via-pink-50 to-red-50"
            >
              <div className="flex flex-col items-center gap-8">
                <MoodOrb intensity={intensity} words={selectedWords} size={250} />
                
                {isLoadingActivity ? (
                  <div className="text-gray-500 text-xl">Loading something fun...</div>
                ) : currentActivity ? (
                  <>
                    <motion.div
                      className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg max-w-sm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p className="text-xl text-gray-700 text-center leading-relaxed">
                        {currentActivity.text}
                      </p>
                    </motion.div>
                    <div className="flex gap-4 flex-wrap justify-center">
                      <Button onClick={handleNext} disabled={isProcessing} emoji="✨">I'll Try It!</Button>
                      <Button onClick={() => {
                        setCurrentActivity(null);
                        if (activityIndex < 2) {
                          setActivityIndex(prev => prev + 1);
                        } else {
                          loadActivity();
                        }
                      }} variant="secondary" disabled={isProcessing}>
                        Different one
                      </Button>
                      <Button onClick={handleSkip} variant="secondary" disabled={isProcessing}>Skip</Button>
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
              subtitle="I'm so proud of you"
              gradient="from-green-50 via-blue-50 to-purple-50"
            >
              <div className="flex flex-col items-center gap-8">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-7xl mb-4"
                >
                  ⭐
                </motion.div>
                <MoodOrb intensity={intensity} words={selectedWords} size={200} />
                <Button onClick={() => router.push('/history')} disabled={isProcessing} emoji="📊">
                  See My History
                </Button>
                <motion.p
                  className="text-lg text-gray-500 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Great job checking in today! 🌟
                </motion.p>
              </div>
            </StepShell>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
