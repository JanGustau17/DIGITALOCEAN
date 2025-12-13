# Unpack - State of Mind

A calm, premium experience for checking in with your feelings, inspired by Apple Watch's State of Mind feature.

## Features

- **Circular Dial Interface**: Digital Crown-style intensity selection (0-100)
- **Mood Orb Visualization**: Dynamic, breathing orb that changes color based on intensity
- **Word Selection**: Simple, kid-safe descriptors
- **AI-Powered Support**: Personalized micro-activities based on your check-in
- **History & Insights**: View patterns and associations over time

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. **Configure ElevenLabs (Optional but Recommended)**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_ELEVENLABS_API_KEY=your_api_key_here
   NEXT_PUBLIC_ELEVENLABS_VOICE_ID=your_voice_id_here
   ```
   See `ELEVENLABS_SETUP.md` for detailed instructions.

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

**Note**: If ElevenLabs is not configured, the app will automatically use browser speech synthesis as a fallback.

## Project Structure

```
unpack/
├── app/
│   ├── page.tsx          # Main check-in flow
│   ├── history/
│   │   └── page.tsx      # History and charts
│   ├── api/
│   │   └── agent/
│   │       └── route.ts  # Agent API endpoint
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── MoodOrb.tsx       # Visual mood orb
│   ├── CrownDial.tsx     # Circular dial interface
│   └── StepShell.tsx     # Step wrapper component
├── lib/
│   ├── types.ts          # TypeScript types
│   └── storage.ts        # localStorage utilities
└── package.json
```

## Check-In Flow

1. **Intro**: Tap "Log how you're feeling right now"
2. **Intensity**: Drag the dial or scroll to set intensity (0-100)
3. **Words**: Select any words that describe your feeling (optional)
4. **Impact**: Choose what's having the biggest impact (optional)
5. **Support**: Try 3 micro-activities suggested by AI
6. **Closing**: View your history

## Data Storage

All entries are stored locally in `localStorage` under the key `unpack_entries`. No login, no names, completely private.

## API Integration

The app uses `/api/agent` to generate personalized activities. Update `app/api/agent/route.ts` with your actual agent implementation.

## Design Principles

- Dark background with soft gradients
- Center mood orb that responds to selections
- Circular dial interaction (like Digital Crown)
- Large, minimal text with high contrast
- Smooth micro-animations
- Always feels calm and premium

## Safety

"Unpack is not medical advice. If something feels unsafe, talk to a trusted adult."

This message is always visible at the bottom of the screen.

