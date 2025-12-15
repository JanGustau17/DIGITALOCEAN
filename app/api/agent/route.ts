import { NextRequest, NextResponse } from 'next/server';
import { SessionState, AgentResponse, StructuredActivityResponse, AgentRequest, ActivityStep } from '@/lib/types';
import { generateActivityPosterAsync, getActivityPosterPlaceholder } from '@/lib/openaiImages';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionSoFar, regenerate = false, variationNonce = '', previousTitles = [] }: AgentRequest = body;

    // Debug log
    console.log('🔍 Agent Request:', {
      variationNonce: variationNonce.substring(0, 8),
      regenerate,
      previousTitlesCount: previousTitles.length,
      intensity: sessionSoFar.intensity,
      words: sessionSoFar.words,
    });

    // Check which AI provider to use (priority: OpenAI > Anthropic > GradientAI)
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const gradientApiKey = process.env.GRADIENT_AI_ACCESS_KEY;
    const gradientApiUrl = process.env.GRADIENT_AI_URL;

    // Try providers in order of quality
    let response: NextResponse;
    if (openaiKey) {
      response = await callOpenAI(sessionSoFar, openaiKey, regenerate, variationNonce, previousTitles);
    } else if (anthropicKey) {
      response = await callAnthropic(sessionSoFar, anthropicKey, regenerate, variationNonce, previousTitles);
    } else if (gradientApiKey && gradientApiUrl) {
      response = await callGradientAI(sessionSoFar, gradientApiKey, gradientApiUrl, regenerate, variationNonce, previousTitles);
    } else {
      // Fallback to hardcoded structured activity
      response = await getStructuredFallbackActivity(sessionSoFar, variationNonce);
    }

    // Set cache headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Agent error:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to generate activity' },
      { status: 500 }
    );
    errorResponse.headers.set('Cache-Control', 'no-store');
    return errorResponse;
  }
}

// Validate structured response
function validateStructuredResponse(data: any): StructuredActivityResponse | null {
  if (!data || typeof data !== 'object') return null;
  
  if (!data.activityTitle || typeof data.activityTitle !== 'string') return null;
  if (!data.activityType || !['breathing', 'movement', 'grounding', 'focus', 'creative'].includes(data.activityType)) return null;
  if (!Array.isArray(data.steps) || data.steps.length !== 3) return null;
  
  // Check all steps have required fields
  for (const step of data.steps) {
    if (!step.instruction || typeof step.instruction !== 'string') return null;
    if (!step.imagePrompt || typeof step.imagePrompt !== 'string') return null;
    // Check instruction length (max 9 words)
    const wordCount = step.instruction.trim().split(/\s+/).length;
    if (wordCount > 9) return null;
  }
  
  // Check for uniqueness
  const instructions = data.steps.map((s: ActivityStep) => s.instruction.toLowerCase().trim());
  const imagePrompts = data.steps.map((s: ActivityStep) => s.imagePrompt.toLowerCase().trim());
  
  if (new Set(instructions).size !== 3) {
    console.warn('❌ Duplicate instructions detected');
    return null;
  }
  if (new Set(imagePrompts).size !== 3) {
    console.warn('❌ Duplicate image prompts detected');
    return null;
  }
  
  return data as StructuredActivityResponse;
}

// Check if response is too similar to previous titles
function isTooSimilar(newActivity: StructuredActivityResponse, previousTitles: string[]): boolean {
  if (previousTitles.length === 0) return false;
  
  const newTitle = newActivity.activityTitle.toLowerCase().trim();
  
  for (const prevTitle of previousTitles) {
    const prevLower = prevTitle.toLowerCase().trim();
    // Check if title matches exactly
    if (newTitle === prevLower) {
      return true;
    }
    // Check if more than 50% of words overlap
    const newWords = new Set(newTitle.split(/\s+/));
    const prevWords = new Set(prevLower.split(/\s+/));
    const overlap = [...newWords].filter(w => prevWords.has(w)).length;
    const similarity = overlap / Math.max(newWords.size, prevWords.size);
    if (similarity > 0.5) {
      return true;
    }
  }
  
  return false;
}

// OpenAI GPT-4
async function callOpenAI(
  sessionState: SessionState, 
  apiKey: string, 
  regenerate: boolean, 
  variationNonce: string,
  previousTitles: string[]
): Promise<NextResponse> {
  const prompt = buildActivityPrompt(sessionState, regenerate, variationNonce, previousTitles);
  
  const systemPrompt = `You are a warm, empathetic friend helping a child (ages 6-12) understand and manage their feelings through simple, visual activities.

CRITICAL RULES:
- ALWAYS return valid JSON matching this EXACT structure (NO markdown, NO code blocks):
{
  "activityTitle": "Short catchy title (max 6 words)",
  "subtitle": "Optional short subtitle",
  "activityType": "breathing" | "movement" | "grounding" | "focus" | "creative",
  "steps": [
    {
      "instruction": "Step 1: getting ready (max 9 words, clear action)",
      "imagePrompt": "Unique kid-friendly sketch description for step 1"
    },
    {
      "instruction": "Step 2: main action (max 9 words, clear action)",
      "imagePrompt": "Unique kid-friendly sketch description for step 2"
    },
    {
      "instruction": "Step 3: ending/reset (max 9 words, clear action)",
      "imagePrompt": "Unique kid-friendly sketch description for step 3"
    }
  ]
}

VALIDATION REQUIREMENTS:
- steps.length MUST be exactly 3
- Each instruction MUST be unique (no duplicates), max 9 words
- Each imagePrompt MUST be unique (no duplicates)
- Each step should represent: 1) starting/getting ready, 2) action, 3) ending/reset
- imagePrompt: Cartoon child character (like educational poster), simple line drawing style, soft pastel colors, white background, child demonstrating the action clearly, educational poster illustration style, friendly and approachable
- instruction: Short, kid-friendly, action-oriented (e.g., "Take a deep breath in", "Hold it for 3 seconds", "Breathe out slowly")
- Show, don't tell: minimal text, clear visual action

${previousTitles.length > 0 ? `\n\nCRITICAL: Do NOT reuse these previous titles:\n${previousTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nYou MUST create a completely different activity with:\n- Different title (avoid similar words)\n- Different 3-step structure\n- Different verbs/actions\n- Different imagery` : ''}

${regenerate ? `IMPORTANT: This is a regeneration request (nonce: ${variationNonce.substring(0, 8)}). Do NOT reuse earlier metaphors, wording, or imagery. Create a completely different activity with different steps and different image prompts.` : ''}

Return ONLY valid JSON, no other text, no markdown.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: regenerate ? 0.95 : 0.85, // Higher temperature for more variety
        response_format: { type: 'json_object' },
        max_tokens: 400,
      }),
      cache: 'no-store', // Prevent caching
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim() || '';
    
    // Remove markdown code blocks if present
    const cleanedContent = content.replace(/^```json\s*|\s*```$/g, '').trim();
    
    // Try to parse and validate
    let structured: StructuredActivityResponse | null = null;
    try {
      const parsed = JSON.parse(cleanedContent);
      structured = validateStructuredResponse(parsed);
      
      // Check if too similar to previous titles
      if (structured && isTooSimilar(structured, previousTitles)) {
        console.warn('⚠️ Response too similar to previous titles, regenerating...');
        structured = null;
      }
    } catch (e) {
      console.log('Failed to parse JSON:', e);
    }
    
    // If validation failed or too similar, retry once with stricter prompt
    if (!structured) {
      console.log('🔄 Retrying with stricter prompt...');
      const retryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: systemPrompt + '\n\nCORRECTION: The previous response was invalid or too similar. Ensure all 3 steps have unique instructions (max 9 words each) and unique image prompts. Create a COMPLETELY different activity from previous titles. Return ONLY valid JSON, no markdown.' 
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.95,
          response_format: { type: 'json_object' },
          max_tokens: 400,
        }),
        cache: 'no-store',
      });
      
      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        const retryContent = retryData.choices[0]?.message?.content?.trim() || '';
        const retryCleaned = retryContent.replace(/^```json\s*|\s*```$/g, '').trim();
        try {
          const retryParsed = JSON.parse(retryCleaned);
          structured = validateStructuredResponse(retryParsed);
          
          // Check similarity again
          if (structured && isTooSimilar(structured, previousTitles)) {
            console.warn('⚠️ Retry also too similar, using fallback');
            structured = null;
          }
        } catch (e) {
          console.log('Retry also failed to parse');
        }
      }
    }
    
    // If still invalid, use fallback
    if (!structured) {
      console.log('📦 Using fallback after validation failure');
      return await getStructuredFallbackActivity(sessionState, variationNonce);
    }
    
    // Return immediately with placeholder - don't block on image generation
    const placeholderImage = getActivityPosterPlaceholder();
    
    const structuredWithPlaceholder: StructuredActivityResponse = {
      ...structured,
      activityImage: null, // Will be set when image is generated
    };

    // Start async poster generation in background (don't await)
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && process.env.GENERATE_STEP_IMAGES !== 'false') {
      // Generate single poster image async - don't block response
      generateActivityPosterAsync(
        structured.steps,
        variationNonce,
        structured.activityType
      ).then(imageUrl => {
        if (imageUrl) {
          console.log('✅ Background activity poster generation complete');
        }
      }).catch(error => {
        console.error('❌ Background activity poster generation failed:', error);
      });
    }

    // Debug log (dev only)
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Structured Activity:', {
        title: structured.activityTitle,
        type: structured.activityType,
        variationNonce: variationNonce.substring(0, 8),
        steps: structured.steps.map(s => ({
          instruction: s.instruction,
          imagePrompt: s.imagePrompt.substring(0, 60) + '...',
        })),
        generatingPoster: true,
      });
    }
    
    return NextResponse.json({
      structured: structuredWithPlaceholder as any,
      activityType: structured.activityType,
      activityImage: placeholderImage, // Return placeholder immediately
      variationNonce, // Include nonce for client-side caching
      generatingImage: true, // Flag to indicate image is being generated
    });
  } catch (error) {
    console.error('OpenAI error:', error);
    return await getStructuredFallbackActivity(sessionState, variationNonce);
  }
}

// Anthropic Claude
async function callAnthropic(
  sessionState: SessionState, 
  apiKey: string, 
  regenerate: boolean, 
  variationNonce: string,
  previousTitles: string[]
): Promise<NextResponse> {
  const prompt = buildActivityPrompt(sessionState, regenerate, variationNonce, previousTitles);
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content: `${buildActivityPrompt(sessionState, regenerate, variationNonce, previousTitles)}\n\nReturn ONLY valid JSON matching: { "activityTitle": "...", "activityType": "...", "steps": [{ "instruction": "...", "imagePrompt": "..." }, ...] } with exactly 3 unique steps. Each instruction max 9 words.`,
          },
        ],
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    const cleanedContent = content.replace(/^```json\s*|\s*```$/g, '').trim();
    
    let structured: StructuredActivityResponse | null = null;
    try {
      const parsed = JSON.parse(cleanedContent);
      structured = validateStructuredResponse(parsed);
      if (structured && isTooSimilar(structured, previousTitles)) {
        structured = null;
      }
    } catch (e) {
      console.log('Failed to parse Anthropic response');
    }
    
    if (!structured) {
      return await getStructuredFallbackActivity(sessionState, variationNonce);
    }
    
    // Return immediately with placeholder for Anthropic too
    const placeholderImage = getActivityPosterPlaceholder();
    
    const structuredWithPlaceholder: StructuredActivityResponse = {
      ...structured,
      activityImage: null,
    };

    // Start async poster generation in background
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && process.env.GENERATE_STEP_IMAGES !== 'false') {
      generateActivityPosterAsync(structured.steps, variationNonce, structured.activityType)
        .then(() => console.log('✅ Background activity poster generation complete'))
        .catch(error => console.error('❌ Background activity poster generation failed:', error));
    }
    
    const responseObj = NextResponse.json({
      structured: structuredWithPlaceholder as any,
      activityType: structured.activityType,
      activityImage: placeholderImage,
      variationNonce,
      generatingImage: true,
    });
    responseObj.headers.set('Cache-Control', 'no-store');
    return responseObj;
  } catch (error) {
    console.error('Anthropic error:', error);
    return await getStructuredFallbackActivity(sessionState, variationNonce);
  }
}

// GradientAI
async function callGradientAI(
  sessionState: SessionState, 
  apiKey: string, 
  apiUrl: string, 
  regenerate: boolean, 
  variationNonce: string,
  previousTitles: string[]
): Promise<NextResponse> {
  const prompt = buildActivityPrompt(sessionState, regenerate, variationNonce, previousTitles);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gradient-access-token': apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are a warm friend helping kids manage feelings. Return ONLY valid JSON: { "activityTitle": "...", "activityType": "...", "steps": [{ "instruction": "...", "imagePrompt": "..." }, ...] } with exactly 3 unique steps. Each instruction max 9 words.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: regenerate ? 0.9 : 0.8,
        max_tokens: 400,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`GradientAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || data.content || '';
    const cleanedContent = typeof content === 'string' ? content.replace(/^```json\s*|\s*```$/g, '').trim() : '';
    
    let structured: StructuredActivityResponse | null = null;
    try {
      const parsed = typeof cleanedContent === 'string' ? JSON.parse(cleanedContent) : content;
      structured = validateStructuredResponse(parsed);
      if (structured && isTooSimilar(structured, previousTitles)) {
        structured = null;
      }
    } catch (e) {
      console.log('Failed to parse GradientAI response');
    }
    
    if (!structured) {
      return await getStructuredFallbackActivity(sessionState, variationNonce);
    }
    
    // Return immediately with placeholder for GradientAI too
    const placeholderImage = getActivityPosterPlaceholder();
    
    const structuredWithPlaceholder: StructuredActivityResponse = {
      ...structured,
      activityImage: null,
    };

    // Start async poster generation in background
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && process.env.GENERATE_STEP_IMAGES !== 'false') {
      generateActivityPosterAsync(structured.steps, variationNonce, structured.activityType)
        .then(() => console.log('✅ Background activity poster generation complete'))
        .catch(error => console.error('❌ Background activity poster generation failed:', error));
    }
    
    const responseObj = NextResponse.json({
      structured: structuredWithPlaceholder as any,
      activityType: structured.activityType,
      activityImage: placeholderImage,
      variationNonce,
      generatingImage: true,
    });
    responseObj.headers.set('Cache-Control', 'no-store');
    return responseObj;
  } catch (error) {
    console.error('GradientAI error:', error);
    return getStructuredFallbackActivity(sessionState, variationNonce);
  }
}

// Build activity prompt
function buildActivityPrompt(
  sessionState: SessionState, 
  regenerate: boolean, 
  variationNonce: string, 
  previousTitles: string[]
): string {
  const { intensity, words, impact } = sessionState;
  
  let intensityDesc = 'really big';
  if (intensity > 75) intensityDesc = 'really big';
  else if (intensity > 50) intensityDesc = 'pretty big';
  else if (intensity > 25) intensityDesc = 'medium';
  else intensityDesc = 'a little bit';
  
  const wordsList = words.length > 0 ? words.join(', ') : 'not sure';
  const impactText = impact || 'not sure';
  
  let context = `A child (age 6-12) is feeling ${intensityDesc} (${intensity}/100). They described it as: ${wordsList}.`;
  if (impactText !== 'not sure') {
    context += ` What's making them feel this way: ${impactText}.`;
  }
  
  if (regenerate && variationNonce) {
    context += `\n\nThis is a new variation (nonce: ${variationNonce.substring(0, 8)}). Create a DIFFERENT activity with different steps, different imagery, and different approach than previous suggestions.`;
  }
  
  if (previousTitles.length > 0) {
    context += `\n\nDo NOT reuse these previous titles: ${previousTitles.join('; ')}. Create something completely new.`;
  }
  
  return `${context}\n\nCreate a 3-step activity that helps them feel better. Each step should be visually distinct and kid-friendly. Return ONLY the JSON object.`;
}

// Structured fallback activities (always 3 unique steps)
async function getStructuredFallbackActivity(sessionState: SessionState, variationNonce: string): Promise<NextResponse> {
  const { intensity, words } = sessionState;
  
  const fallbacks: StructuredActivityResponse[] = [
    {
      activityTitle: 'Take Three Deep Breaths',
      activityType: 'breathing',
      steps: [
        {
          instruction: 'Sit comfortably and close your eyes',
          imagePrompt: 'A child sitting cross-legged with eyes closed, peaceful expression, soft pastel colors, white background, educational poster illustration style, simple line drawing',
        },
        {
          instruction: 'Breathe in slowly like smelling a flower',
          imagePrompt: 'Cartoon child character breathing in deeply, holding a flower, gentle smile, educational poster illustration style, soft pastel colors, white background, simple line drawing',
        },
        {
          instruction: 'Breathe out slowly like blowing bubbles',
          imagePrompt: 'Cartoon child character blowing out gently, colorful bubbles floating, happy expression, educational poster illustration style, bright pastels, white background, simple line drawing',
        },
      ],
    },
    {
      activityTitle: 'Stretch and Wiggle',
      activityType: 'movement',
      steps: [
        {
          instruction: 'Stand up and reach your arms high',
          imagePrompt: 'A child standing with arms stretched up high, reaching for sky, educational poster illustration style, simple line drawing, white background',
        },
        {
          instruction: 'Wiggle your whole body like a jellyfish',
          imagePrompt: 'A child wiggling and moving playfully, fun movement, colorful and energetic, white background, educational poster illustration style, simple line drawing',
        },
        {
          instruction: 'Shake your hands and take a deep breath',
          imagePrompt: 'A child shaking hands gently then taking a calm breath, peaceful ending, soft colors, white background, educational poster illustration style, simple line drawing',
        },
      ],
    },
    {
      activityTitle: 'Look Around You',
      activityType: 'grounding',
      steps: [
        {
          instruction: 'Find 5 things you can see around you',
          imagePrompt: 'A child looking around curiously, pointing at objects, bright and friendly, white background, educational poster illustration style, simple line drawing',
        },
        {
          instruction: 'Name the colors you see',
          imagePrompt: 'Colorful objects around the child, rainbow colors, cheerful and vibrant, white background, educational poster illustration style, simple line drawing',
        },
        {
          instruction: 'Take a deep breath and smile',
          imagePrompt: 'A child taking a breath and smiling, calm and happy, warm colors, white background, educational poster illustration style, simple line drawing',
        },
      ],
    },
    {
      activityTitle: 'Count Backwards',
      activityType: 'focus',
      steps: [
        {
          instruction: 'Close your eyes and get ready',
          imagePrompt: 'A child closing eyes, preparing to focus, peaceful and calm, white background, educational poster illustration style, simple line drawing',
        },
        {
          instruction: 'Count backwards slowly from 10',
          imagePrompt: 'Numbers floating around child, counting down, focused expression, soft colors, white background, educational poster illustration style, simple line drawing',
        },
        {
          instruction: 'Open your eyes and take a breath',
          imagePrompt: 'A child opening eyes, refreshed and calm, bright and peaceful, white background, educational poster illustration style, simple line drawing',
        },
      ],
    },
    {
      activityTitle: 'Draw How You Feel',
      activityType: 'creative',
      steps: [
        {
          instruction: 'Get paper and something to draw with',
          imagePrompt: 'A child getting drawing supplies, excited and ready, colorful, white background, educational poster illustration style, simple line drawing',
        },
        {
          instruction: 'Draw or doodle how you feel right now',
          imagePrompt: 'A child drawing on paper, creative expression, colorful markers, white background, educational poster illustration style, simple line drawing',
        },
        {
          instruction: 'Look at your drawing and take a breath',
          imagePrompt: 'A child looking at their drawing, satisfied and calm, peaceful expression, white background, educational poster illustration style, simple line drawing',
        },
      ],
    },
  ];
  
  // Select based on intensity/words, vary by nonce hash
  let selected: StructuredActivityResponse;
  const nonceHash = variationNonce ? parseInt(variationNonce.substring(0, 8), 16) : 0;
  
  if (intensity > 70 && (words.includes('stormy') || words.includes('stuck'))) {
    selected = fallbacks[0]; // breathing
  } else if (words.includes('tired') || words.includes('heavy')) {
    selected = fallbacks[1]; // movement
  } else if (words.includes('buzzy') || words.includes('excited')) {
    selected = fallbacks[3]; // focus
  } else {
    selected = fallbacks[nonceHash % fallbacks.length];
  }
  
  // Return immediately with placeholder for fallback too
  const placeholderImage = getActivityPosterPlaceholder();
  
  const selectedWithPlaceholder: StructuredActivityResponse = {
    ...selected,
    activityImage: null,
  };

  // Start async poster generation in background
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && process.env.GENERATE_STEP_IMAGES !== 'false') {
    generateActivityPosterAsync(selected.steps, variationNonce, selected.activityType)
      .then(() => console.log('✅ Background fallback poster generation complete'))
      .catch(error => console.error('❌ Background fallback poster generation failed:', error));
  }

  const responseObj = NextResponse.json({
    structured: selectedWithPlaceholder as any,
    activityType: selected.activityType,
    activityImage: placeholderImage,
    variationNonce,
    generatingImage: true,
  });
  responseObj.headers.set('Cache-Control', 'no-store');
  return responseObj;
}
