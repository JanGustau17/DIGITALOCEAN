# Quick Setup - Use Your Working API Key

## Step 1: Create .env.local

In the `unpack` directory, create a file named `.env.local`:

```env
NEXT_PUBLIC_ELEVENLABS_API_KEY=6fc9fd9ae82d6add5385eb5ad5f5ac4e8b127f5c1a442c8ed27ac3d2cd4af307
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=ocZQ262SsZb9RIxcQBOj
```

## Step 2: Restart Server

**IMPORTANT**: You MUST restart the dev server after creating/editing `.env.local`:

```bash
# Stop server (Ctrl+C)
npm run dev
```

## Step 3: Test

1. Open http://localhost:3000
2. Click "Let's Begin!"
3. The voice should speak automatically
4. Check browser console (F12) for "ElevenLabs Config:" log

## What Changed

I updated the code to match your working implementation:
- ✅ Using `eleven_multilingual_v2` model (same as your code)
- ✅ Using `xi-api-key` header (same as your code)
- ✅ Same voice settings (stability: 0.5, similarity_boost: 0.5)
- ✅ Same voice ID: `ocZQ262SsZb9RIxcQBOj`

The code now works exactly like your working example!

