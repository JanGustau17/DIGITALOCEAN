// ElevenLabs Text-to-Speech Service for Next.js
// Based on working implementation

let currentAudio: HTMLAudioElement | null = null;
let isSpeaking = false;
let speechQueue: Array<{ text: string; options: any }> = [];
let isProcessingQueue = false;

export const speak = async (text: string, options: { rate?: number; pitch?: number; volume?: number } = {}): Promise<void> => {
  // Always stop any current speech first
  stopSpeaking();
  
  // Clear any pending speech in queue
  speechQueue = [];
  
  // Small delay to ensure previous audio is fully stopped
  await new Promise(resolve => setTimeout(resolve, 100));

  // Get API key and Voice ID from environment variables
  // In Next.js, NEXT_PUBLIC_ vars are available at runtime in the browser
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';
  
  // Your preferred voice ID - ensure it's in .env.local as NEXT_PUBLIC_ELEVENLABS_VOICE_ID
  // Use the one from .env.local, fallback to your preferred one
  const voiceId = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'yj30vwTGJxSHezdAGsv9';

  // Debug logging - always log to help debug
  if (typeof window !== 'undefined') {
    console.log('🔊 ElevenLabs Config:', { 
      hasApiKey: !!apiKey, 
      hasVoiceId: !!voiceId,
      voiceId: voiceId,
      envVoiceId: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID,
      usingVoiceId: voiceId,
      allEnvVars: Object.keys(process.env).filter(k => k.includes('ELEVENLABS'))
    });
    console.log('🎯 ACTUAL VOICE ID BEING USED:', voiceId);
  }

  if (!apiKey) {
    console.warn('ElevenLabs API key not configured. Using browser speech synthesis as fallback.');
    return speakFallback(text, options);
  }

  try {
    // Log the exact voice ID being used
    console.log('🎤 Using Voice ID:', voiceId);
    console.log('🎤 Full API URL:', `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`);
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2', // Using the same model as your working code
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail?.message || `HTTP error! status: ${response.status}`;
      console.error('ElevenLabs API error:', errorMessage, errorData);
      throw new Error(errorMessage);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    currentAudio = new Audio(audioUrl);
    isSpeaking = true;
    if (speechStateCallback) speechStateCallback(true);

    return new Promise((resolve, reject) => {
      if (!currentAudio) {
        reject(new Error('Audio element not created'));
        return;
      }

      currentAudio.onended = () => {
        isSpeaking = false;
        if (speechStateCallback) speechStateCallback(false);
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      
      currentAudio.onerror = (error) => {
        isSpeaking = false;
        if (speechStateCallback) speechStateCallback(false);
        URL.revokeObjectURL(audioUrl);
        console.error('Audio playback error:', error);
        reject(error);
      };

      currentAudio.play().catch((error) => {
        isSpeaking = false;
        if (speechStateCallback) speechStateCallback(false);
        URL.revokeObjectURL(audioUrl);
        console.error('Audio play error:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('ElevenLabs error:', error);
    // Fallback to browser speech
    return speakFallback(text, options);
  }
};

// Fallback to browser speech synthesis
const speakFallback = (text: string, options: { rate?: number; pitch?: number; volume?: number } = {}): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    isSpeaking = true;
    if (speechStateCallback) speechStateCallback(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 0.85;
    utterance.pitch = options.pitch || 1.1;
    utterance.volume = options.volume || 1.0;
    
    utterance.onend = () => {
      isSpeaking = false;
      if (speechStateCallback) speechStateCallback(false);
      resolve();
    };
    utterance.onerror = (error) => {
      isSpeaking = false;
      if (speechStateCallback) speechStateCallback(false);
      reject(error);
    };
    
    window.speechSynthesis.speak(utterance);
  });
};

export const stopSpeaking = (): void => {
  // Stop ElevenLabs audio
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      if (currentAudio.src && currentAudio.src.startsWith('blob:')) {
        URL.revokeObjectURL(currentAudio.src);
      }
    } catch (e) {
      console.log('Error stopping audio:', e);
    }
    currentAudio = null;
  }
  
  // Stop browser speech synthesis
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.log('Error canceling speech synthesis:', e);
    }
  }
  
  isSpeaking = false;
  speechQueue = [];
  isProcessingQueue = false;
  if (speechStateCallback) speechStateCallback(false);
};

export const isCurrentlySpeaking = (): boolean => isSpeaking;

// Callback to notify when speech starts/ends
let speechStateCallback: ((speaking: boolean) => void) | null = null;

export const setSpeechStateCallback = (callback: (speaking: boolean) => void) => {
  speechStateCallback = callback;
};
