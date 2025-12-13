# Quick Start Guide

## Installation

```bash
cd unpack
npm install
```

## Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## What's Included

### ✅ Complete Check-In Flow
- Intro screen with "Log how you're feeling right now" button
- Intensity dial (0-100) with Digital Crown-style interaction
- Optional word selection (10 kid-safe descriptors)
- Optional impact selection
- AI-powered support activities (3 micro-activities)
- Closing screen with history link

### ✅ History Page
- Line chart showing intensity over time (last 7 entries)
- Bar chart showing top selected words
- Simple associations (time of day, weekday patterns)

### ✅ Core Components
- **MoodOrb**: Visual orb that changes color based on intensity (0-33: blue/teal, 34-66: green/yellow, 67-100: orange/red)
- **CrownDial**: Circular dial with drag and scroll support
- **StepShell**: Wrapper component with back button and safety text

### ✅ Data Storage
- All entries stored in localStorage
- No login, no names, completely private
- Key: `unpack_entries`

## API Integration

The app uses `/app/api/agent/route.ts` for generating activities. 

**Current implementation**: Simple fallback logic based on intensity and words.

**To integrate your existing agent**:
1. Open `/app/api/agent/route.ts`
2. Replace the placeholder logic with your actual agent call
3. Ensure it accepts `{ sessionSoFar: SessionState }` and returns `AgentResponse`

## Design Features

- Dark background with soft gradients
- Premium, calm aesthetic
- Smooth Framer Motion animations
- Apple Watch-inspired circular interactions
- High contrast, minimal text
- Always-visible safety footer

## File Structure

```
unpack/
├── app/
│   ├── page.tsx              # Main check-in flow (/)
│   ├── history/page.tsx      # History page (/history)
│   ├── api/agent/route.ts    # Agent API endpoint
│   └── layout.tsx            # Root layout
├── components/
│   ├── MoodOrb.tsx           # Visual mood orb
│   ├── CrownDial.tsx         # Circular dial
│   └── StepShell.tsx         # Step wrapper
└── lib/
    ├── types.ts              # TypeScript types
    └── storage.ts            # localStorage utilities
```

## Next Steps

1. **Customize Agent**: Update `/app/api/agent/route.ts` with your actual agent implementation
2. **Adjust Colors**: Modify `MoodOrb.tsx` color mapping if needed
3. **Add More Words**: Edit `WORDS` array in `app/page.tsx`
4. **Customize Activities**: Update `FALLBACK_ACTIVITIES` in `app/page.tsx`

## Notes

- All animations are client-side only (no SSR issues)
- localStorage is used for persistence (works offline)
- The app is fully responsive
- Safety text is always visible at bottom

