// ElevenLabs Text-to-Speech Service for Next.js
// Based on working implementation

let currentAudio: HTMLAudioElement | null = null;
let isSpeaking = false;

export const speak = async (text: string, options: { rate?: number; pitch?: number; volume?: number } = {}): Promise<void> => {
  // Stop any current speech
  if (currentAudio && isSpeaking) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    if (currentAudio.src) {
      URL.revokeObjectURL(currentAudio.src);
    }
  }

  // Get API key and Voice ID from environment variables
  // Fallback to default voice ID if not set
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';
  const voiceId = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'ocZQ262SsZb9RIxcQBOj';

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('ElevenLabs Config:', { 
      hasApiKey: !!apiKey, 
      hasVoiceId: !!voiceId,
      voiceId: voiceId
    });
  }

  if (!apiKey) {
    console.warn('ElevenLabs API key not configured. Using browser speech synthesis as fallback.');
    return speakFallback(text, options);
  }

  try {
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

    return new Promise((resolve, reject) => {
      if (!currentAudio) {
        reject(new Error('Audio element not created'));
        return;
      }

      currentAudio.onended = () => {
        isSpeaking = false;
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      
      currentAudio.onerror = (error) => {
        isSpeaking = false;
        URL.revokeObjectURL(audioUrl);
        console.error('Audio playback error:', error);
        reject(error);
      };

      currentAudio.play().catch((error) => {
        isSpeaking = false;
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

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 0.85;
    utterance.pitch = options.pitch || 1.1;
    utterance.volume = options.volume || 1.0;
    
    utterance.onend = () => resolve();
    utterance.onerror = (error) => reject(error);
    
    window.speechSynthesis.speak(utterance);
  });
};

export const stopSpeaking = (): void => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    if (currentAudio.src) {
      URL.revokeObjectURL(currentAudio.src);
    }
    isSpeaking = false;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const isCurrentlySpeaking = (): boolean => isSpeaking;
