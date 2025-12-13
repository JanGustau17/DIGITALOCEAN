import { NextRequest, NextResponse } from 'next/server';
import { SessionState, AgentResponse } from '@/lib/types';

// This is a placeholder - replace with your actual agent implementation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionSoFar }: { sessionSoFar: SessionState } = body;

    // Your existing agent logic here
    // For now, return a fallback response
    const activities = [
      { text: 'Take 3 big, slow breaths. Breathe in like you\'re smelling a flower, hold it, then breathe out like you\'re blowing out birthday candles!', type: 'breathing' },
      { text: 'Look around you and name 5 things you can see. What colors are they?', type: 'grounding' },
      { text: 'Stand up and stretch your arms way up high like you\'re reaching for the stars! Then shake your hands and wiggle your body.', type: 'movement' },
      { text: 'Count backwards from 10 slowly, like you\'re counting down to a rocket launch!', type: 'focus' },
      { text: 'Draw a quick doodle or write one word about how you feel. It can be anything!', type: 'creative' },
    ];

    // Kid-friendly activity selection
    let activityIndex = 0;
    if (sessionSoFar.intensity > 70 && (sessionSoFar.words.includes('stormy') || sessionSoFar.words.includes('stuck'))) {
      activityIndex = 0; // breathing - helps with big feelings
    } else if (sessionSoFar.words.includes('tired') || sessionSoFar.words.includes('heavy')) {
      activityIndex = 2; // movement - helps wake up the body
    } else if (sessionSoFar.words.includes('buzzy') || sessionSoFar.words.includes('excited')) {
      activityIndex = 3; // focus - helps calm down
    } else {
      activityIndex = Math.floor(Math.random() * activities.length);
    }

    const response: AgentResponse = {
      activityText: activities[activityIndex].text,
      activityType: activities[activityIndex].type,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Agent error:', error);
    return NextResponse.json(
      { error: 'Failed to generate activity' },
      { status: 500 }
    );
  }
}

