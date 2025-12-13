# How Your AI Agent Works in This Project

## Overview
Your AI agent (DigitalOcean GradientAI) generates personalized, kid-friendly activities based on the child's emotional check-in responses.

## Flow Diagram

```
1. Child completes check-in:
   ├─ Intensity: 0-100 (e.g., 75)
   ├─ Words: ["excited", "buzzy"] 
   └─ Impact: "school"

2. User reaches "Support" step
   └─ Frontend calls: POST /api/agent
      └─ Sends: { sessionSoFar: { intensity, words, impact, step } }

3. API Route (/app/api/agent/route.ts):
   ├─ Checks for GradientAI credentials (.env.local)
   │  ├─ GRADIENT_AI_ACCESS_KEY
   │  └─ GRADIENT_AI_URL
   │
   ├─ If credentials exist:
   │  ├─ Builds kid-friendly prompt from session data
   │  ├─ Calls GradientAI API with:
   │  │  ├─ System message: "You are a friendly assistant..."
   │  │  ├─ User prompt: "A kid is feeling..."
   │  │  └─ Temperature: 0.7, Max tokens: 200
   │  │
   │  └─ Parses response (handles multiple formats)
   │
   └─ If no credentials OR API fails:
      └─ Uses fallback activities (hardcoded)

4. Response sent back:
   {
     activityText: "Take 3 big, slow breaths...",
     activityType: "breathing"
   }

5. Frontend displays activity to child
```

## Current Configuration

### Environment Variables Needed:
```env
GRADIENT_AI_ACCESS_KEY=your_access_key_here
GRADIENT_AI_URL=https://your-gradient-ai-endpoint-url
```

### Where It's Used:
- **File**: `/app/api/agent/route.ts`
- **Called from**: `/app/page.tsx` → `loadActivity()` function
- **When**: User reaches the "Support" step (step 4 of 5)

## How the Prompt is Built

The agent receives a prompt like this:

```
A kid is checking in about their feelings. Here's what they shared:

- How big the feeling is: pretty big (75/100)
- Words that fit: excited, buzzy
- What's making them feel this way: school

Generate ONE simple, kid-friendly activity (1-2 sentences max)...
```

## Response Handling

The code handles multiple GradientAI response formats:
1. `{ choices: [{ message: { content: "..." } }] }` (OpenAI-style)
2. `{ content: "..." }` (Direct content)
3. `{ text: "..." }` (Text field)
4. Plain string

## Fallback System

If GradientAI fails or isn't configured:
- Uses hardcoded activities from `FALLBACK_ACTIVITIES` array
- Selects activity based on:
  - High intensity + stormy/stuck → breathing
  - Tired/heavy → movement
  - Buzzy/excited → focus
  - Otherwise → random selection

## Activity Types

The agent categorizes activities into:
- `breathing` - Breathing exercises
- `grounding` - 5 senses, naming things
- `movement` - Stretching, wiggling
- `focus` - Counting, focusing
- `creative` - Drawing, writing

## Testing Your Agent

1. **Check your `.env.local` file** has:
   ```env
   GRADIENT_AI_ACCESS_KEY=your_key
   GRADIENT_AI_URL=your_url
   ```

2. **Restart dev server** after changing `.env.local`

3. **Go through check-in flow**:
   - Select intensity
   - Choose words
   - Select impact
   - Reach "Support" step → Agent should generate activity

4. **Check browser console** for any API errors

5. **Check server logs** (terminal) for GradientAI API responses

## Current Status

Based on your code:
- ✅ Agent integration is complete
- ✅ Fallback system works
- ⚠️ Need to configure GradientAI credentials in `.env.local`
- ⚠️ Need to verify GradientAI API URL format matches expected response

## Why It Might Not Be Working

1. **Missing credentials** → Falls back to hardcoded activities (silent)
2. **Wrong API URL** → Check console for 404/500 errors
3. **Wrong auth format** → Currently uses `Authorization: Bearer ${key}`
4. **Response format mismatch** → Check if GradientAI returns different format
5. **CORS issues** → Shouldn't happen (server-side API route)

## Next Steps to Debug

1. Check `.env.local` has correct values
2. Check browser console for fetch errors
3. Check server terminal for API response logs
4. Verify GradientAI API URL format matches your endpoint

