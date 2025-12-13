import { NextRequest, NextResponse } from 'next/server';
import { SessionState, AgentResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionSoFar }: { sessionSoFar: SessionState } = body;

    // Check which AI provider to use (priority: OpenAI > Anthropic > GradientAI)
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const gradientApiKey = process.env.GRADIENT_AI_ACCESS_KEY;
    const gradientApiUrl = process.env.GRADIENT_AI_URL;

    // Try providers in order of quality
    if (openaiKey) {
      return await callOpenAI(sessionSoFar, openaiKey);
    } else if (anthropicKey) {
      return await callAnthropic(sessionSoFar, anthropicKey);
    } else if (gradientApiKey && gradientApiUrl) {
      return await callGradientAI(sessionSoFar, gradientApiKey, gradientApiUrl);
    } else {
      // Fallback to smart hardcoded activities
      return getSmartFallbackActivity(sessionSoFar);
    }
  } catch (error) {
    console.error('Agent error:', error);
    return NextResponse.json(
      { error: 'Failed to generate activity' },
      { status: 500 }
    );
  }
}

// OpenAI GPT-4 (Best for human-like, empathetic responses)
async function callOpenAI(sessionState: SessionState, apiKey: string): Promise<NextResponse> {
  try {
    const prompt = buildHumanLikePrompt(sessionState);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost-effective, still very good
        messages: [
          {
            role: 'system',
            content: `You are a warm, empathetic friend helping a child understand and manage their feelings. 
            You speak like a caring adult who really understands kids - warm, encouraging, and never condescending.
            You acknowledge their feelings first, then suggest activities that feel natural and helpful.
            Keep responses to 2-3 sentences max. Be conversational, like you're talking to them directly.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8, // More creative and varied
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const activityText = data.choices[0]?.message?.content?.trim() || '';
    const activityType = determineActivityType(activityText, sessionState);

    return NextResponse.json({
      activityText,
      activityType,
    });
  } catch (error) {
    console.error('OpenAI error:', error);
    return getSmartFallbackActivity(sessionState);
  }
}

// Anthropic Claude (Great for safety and empathy)
async function callAnthropic(sessionState: SessionState, apiKey: string): Promise<NextResponse> {
  try {
    const prompt = buildHumanLikePrompt(sessionState);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Fast and cost-effective
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: `You are a warm, empathetic friend helping a child understand and manage their feelings. 
            You speak like a caring adult who really understands kids - warm, encouraging, and never condescending.
            You acknowledge their feelings first, then suggest activities that feel natural and helpful.
            Keep responses to 2-3 sentences max. Be conversational, like you're talking to them directly.
            
            ${prompt}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const activityText = data.content[0]?.text?.trim() || '';
    const activityType = determineActivityType(activityText, sessionState);

    return NextResponse.json({
      activityText,
      activityType,
    });
  } catch (error) {
    console.error('Anthropic error:', error);
    return getSmartFallbackActivity(sessionState);
  }
}

// GradientAI (Enhanced with better prompts)
async function callGradientAI(sessionState: SessionState, apiKey: string, apiUrl: string): Promise<NextResponse> {
  try {
    const prompt = buildHumanLikePrompt(sessionState);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are a warm, empathetic friend helping a child understand and manage their feelings. 
            You speak like a caring adult who really understands kids - warm, encouraging, and never condescending.
            You acknowledge their feelings first, then suggest activities that feel natural and helpful.
            Keep responses to 2-3 sentences max. Be conversational, like you're talking to them directly.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`GradientAI API error: ${response.status}`);
    }

    const data = await response.json();
    const activityText = extractActivityText(data);
    const activityType = determineActivityType(activityText, sessionState);

    return NextResponse.json({
      activityText,
      activityType,
    });
  } catch (error) {
    console.error('GradientAI error:', error);
    return getSmartFallbackActivity(sessionState);
  }
}

// Build a much more human-like, personalized prompt
function buildHumanLikePrompt(sessionState: SessionState): string {
  const { intensity, words, impact } = sessionState;
  
  // Map intensity to empathetic language
  let intensityDesc = '';
  let intensityFeeling = '';
  if (intensity > 80) {
    intensityDesc = 'really, really big';
    intensityFeeling = 'overwhelming';
  } else if (intensity > 60) {
    intensityDesc = 'really big';
    intensityFeeling = 'strong';
  } else if (intensity > 40) {
    intensityDesc = 'pretty big';
    intensityFeeling = 'noticeable';
  } else if (intensity > 20) {
    intensityDesc = 'medium';
    intensityFeeling = 'present';
  } else {
    intensityDesc = 'a little bit';
    intensityFeeling = 'small';
  }
  
  // Analyze word combinations for personalized understanding
  const hasNegativeWords = words.some(w => ['stormy', 'stuck', 'heavy', 'tired'].includes(w));
  const hasPositiveWords = words.some(w => ['excited', 'buzzy', 'smooth', 'okay'].includes(w));
  const hasCalmWords = words.some(w => ['calm', 'smooth', 'okay'].includes(w));
  const hasEnergyWords = words.some(w => ['buzzy', 'wiggly', 'excited'].includes(w));
  
  // Build context about their specific situation
  let context = '';
  if (words.length > 0) {
    if (words.includes('stormy') && words.includes('stuck')) {
      context = 'They\'re feeling stormy and stuck - like everything is too much and they can\'t move forward.';
    } else if (words.includes('excited') && words.includes('buzzy')) {
      context = 'They\'re feeling super excited and buzzy - lots of energy that might need channeling.';
    } else if (words.includes('tired') && words.includes('heavy')) {
      context = 'They\'re feeling tired and heavy - like their body and mind need some gentle care.';
    } else if (words.includes('calm') && intensity < 40) {
      context = 'They\'re feeling pretty calm - maybe they just need a gentle activity to stay balanced.';
    } else {
      context = `They described their feelings as: ${words.join(', ')}.`;
    }
  }
  
  const impactText = impact || 'not sure';
  let impactContext = '';
  if (impact === 'school') {
    impactContext = 'School is what\'s making them feel this way.';
  } else if (impact === 'friends') {
    impactContext = 'Their friends are what\'s making them feel this way.';
  } else if (impact === 'home') {
    impactContext = 'Something at home is what\'s making them feel this way.';
  } else if (impact === 'my body') {
    impactContext = 'Their body is what\'s making them feel this way.';
  }

  return `A child (age 6-12) just checked in about their feelings. Here's what they shared:

- The feeling is ${intensityDesc} (${intensity}/100) - it feels ${intensityFeeling}
- ${context}
- ${impactContext || `What's making them feel this way: ${impactText}`}

Your task: Respond directly to the child in a warm, conversational way. 

First, acknowledge their feeling briefly and empathetically (like "I hear that you're feeling..." or "It sounds like...").

Then, suggest ONE simple activity they can do right now (1-2 sentences). Make it:
- Specific to their exact situation (${words.join(', ')}, ${impactText})
- Fun and engaging for a kid
- Easy to do independently
- Conversational, like you're talking directly to them

Example good responses:
- "I hear that you're feeling really stormy and stuck right now. That's okay - big feelings happen! Let's try something that helps when everything feels too much: Take 3 big, slow breaths. Breathe in like you're smelling a flower, hold it, then breathe out like you're blowing out birthday candles!"
- "Wow, it sounds like you're super excited about your friends! That's awesome! Sometimes when we're this buzzy, our body needs a little help calming down. Let's try counting backwards from 10 slowly, like you're counting down to a rocket launch!"
- "School can feel really heavy sometimes, especially when you're tired. I get it. Let's do something gentle that helps your body feel lighter: Stand up and stretch your arms way up high like you're reaching for the stars!"

Respond ONLY with your message to the child (no explanations, no quotes).`;
}

function extractActivityText(data: any): string {
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content.trim();
  }
  if (data.content && Array.isArray(data.content) && data.content[0]?.text) {
    return data.content[0].text.trim();
  }
  if (data.content) {
    return data.content.trim();
  }
  if (data.text) {
    return data.text.trim();
  }
  if (typeof data === 'string') {
    return data.trim();
  }
  
  return 'Take 3 big, slow breaths. Breathe in like you\'re smelling a flower, hold it, then breathe out like you\'re blowing out birthday candles!';
}

function determineActivityType(activityText: string, sessionState: SessionState): string {
  const text = activityText.toLowerCase();
  
  if (text.includes('breath') || text.includes('breathe')) return 'breathing';
  if (text.includes('see') || text.includes('look') || text.includes('name') || text.includes('color') || text.includes('around')) return 'grounding';
  if (text.includes('stretch') || text.includes('move') || text.includes('wiggle') || text.includes('shake') || text.includes('stand')) return 'movement';
  if (text.includes('count') || text.includes('focus') || text.includes('think') || text.includes('backwards')) return 'focus';
  if (text.includes('draw') || text.includes('write') || text.includes('doodle') || text.includes('create')) return 'creative';
  
  // Default based on intensity/words
  if (sessionState.intensity > 70) return 'breathing';
  if (sessionState.words.includes('tired') || sessionState.words.includes('heavy')) return 'movement';
  if (sessionState.words.includes('buzzy') || sessionState.words.includes('excited')) return 'focus';
  
  return 'breathing';
}

// Smart fallback that's more personalized
function getSmartFallbackActivity(sessionState: SessionState): NextResponse {
  const { intensity, words, impact } = sessionState;
  
  // More personalized fallback activities
  const activities = {
    stormy_stuck: [
      { text: 'I hear that you\'re feeling really stormy and stuck right now. That\'s okay - big feelings happen! Let\'s try something that helps when everything feels too much: Take 3 big, slow breaths. Breathe in like you\'re smelling a flower, hold it, then breathe out like you\'re blowing out birthday candles!', type: 'breathing' },
      { text: 'When feelings feel stormy and stuck, sometimes our body needs to move. Let\'s try this: Stand up and shake your whole body like a dog shaking off water! Start with your hands, then your arms, then your whole body. How does that feel?', type: 'movement' },
    ],
    excited_buzzy: [
      { text: 'Wow, it sounds like you\'re super excited and buzzy! That\'s awesome! Sometimes when we\'re this buzzy, our body needs a little help calming down. Let\'s try counting backwards from 10 slowly, like you\'re counting down to a rocket launch!', type: 'focus' },
      { text: 'You\'re feeling really excited and buzzy - I love that energy! Let\'s channel it into something fun: Look around you and name 5 things you can see. What colors are they? Can you find something blue? Something red?', type: 'grounding' },
    ],
    tired_heavy: [
      { text: `${impact === 'school' ? 'School' : 'Things'} can feel really heavy sometimes, especially when you\'re tired. I get it. Let\'s do something gentle that helps your body feel lighter: Stand up and stretch your arms way up high like you\'re reaching for the stars! Then slowly bring them down.`, type: 'movement' },
      { text: 'When you\'re feeling tired and heavy, sometimes a little movement helps wake up your body. Try this: Wiggle your fingers, then your hands, then your arms, then your whole body! Start small and get bigger. How does that feel?', type: 'movement' },
    ],
    calm_low: [
      { text: 'It sounds like you\'re feeling pretty calm right now - that\'s great! Let\'s do something gentle to help you stay balanced: Take 3 slow, deep breaths. Notice how your belly moves in and out.', type: 'breathing' },
      { text: 'You\'re feeling calm - I love that! Let\'s keep that peaceful feeling going. Look around you and notice 3 things you can see, 2 things you can hear, and 1 thing you can feel with your hands.', type: 'grounding' },
    ],
    default: [
      { text: 'I hear you. Let\'s try something together that might help: Take 3 big, slow breaths. Breathe in like you\'re smelling a flower, hold it, then breathe out like you\'re blowing out birthday candles!', type: 'breathing' },
      { text: 'Let\'s try something fun together! Look around you and name 5 things you can see. What colors are they? Can you find something that makes you smile?', type: 'grounding' },
      { text: 'Sometimes a little movement helps. Stand up and stretch your arms way up high like you\'re reaching for the stars! Then shake your hands and wiggle your body.', type: 'movement' },
      { text: 'Let\'s try something that helps focus: Count backwards from 10 slowly, like you\'re counting down to a rocket launch! 10... 9... 8...', type: 'focus' },
    ],
  };

  let selectedActivity;
  
  // Smart selection based on word combinations
  if (words.includes('stormy') && words.includes('stuck')) {
    selectedActivity = activities.stormy_stuck[Math.floor(Math.random() * activities.stormy_stuck.length)];
  } else if (words.includes('excited') && words.includes('buzzy')) {
    selectedActivity = activities.excited_buzzy[Math.floor(Math.random() * activities.excited_buzzy.length)];
  } else if ((words.includes('tired') || words.includes('heavy')) && intensity > 50) {
    selectedActivity = activities.tired_heavy[Math.floor(Math.random() * activities.tired_heavy.length)];
  } else if ((words.includes('calm') || words.includes('smooth')) && intensity < 40) {
    selectedActivity = activities.calm_low[Math.floor(Math.random() * activities.calm_low.length)];
  } else {
    // Select from default based on intensity
    const defaultActivities = activities.default;
    if (intensity > 70) {
      selectedActivity = defaultActivities[0]; // breathing
    } else if (intensity < 30) {
      selectedActivity = defaultActivities[1]; // grounding
    } else {
      selectedActivity = defaultActivities[Math.floor(Math.random() * defaultActivities.length)];
    }
  }

  return NextResponse.json({
    activityText: selectedActivity.text,
    activityType: selectedActivity.type,
  });
}
