export interface UnpackEntry {
  ts: string; // ISO string
  intensity: number; // 0-100
  words: string[];
  impact: string | null;
  activityType: string | null;
}

export interface SessionState {
  intensity: number;
  words: string[];
  impact: string | null;
  step: string;
}

export interface ActivityStep {
  instruction: string; // Short, kid-friendly, max 9 words
  imagePrompt: string; // Distinct prompt for kid-friendly illustration
  imageUrl?: string; // Generated image URL (added server-side)
}

export interface StructuredActivityResponse {
  activityTitle: string; // Short, catchy title for kids
  subtitle?: string; // Optional short subtitle
  activityType: 'breathing' | 'movement' | 'grounding' | 'focus' | 'creative';
  steps: [ActivityStep, ActivityStep, ActivityStep]; // Exactly 3 unique steps
  activityImage?: string | null; // Single collage poster image (base64 or URL)
}

export interface AgentRequest {
  sessionSoFar: SessionState;
  regenerate?: boolean;
  variationNonce?: string; // UUID for cache-busting
  previousTitles?: string[]; // Last 3 titles to avoid repeating
}

export interface AgentResponse {
  activityText?: string; // Legacy support
  activityType: string;
  skip?: boolean;
  // New structured format - always present
  structured: StructuredActivityResponse;
  activityImage?: string | null; // Single collage poster image
  variationNonce?: string; // Nonce for caching
}

export interface ImageGenerationRequest {
  prompt: string; // Single image prompt
  variationNonce: string; // UUID for cache-busting
}

export interface ImageGenerationResponse {
  imageUrl: string; // Base64 data URL or URL
}
