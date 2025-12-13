# Quick Voice Setup

## Create `.env.local` file

Create a file named `.env.local` in the `unpack` directory with:

```env
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_api_key_here
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=ocZQ262SsZb9RIxcQBOj
```

Replace `your_api_key_here` with your actual ElevenLabs API key.

## Restart Server

After creating `.env.local`, restart your dev server:

```bash
npm run dev
```

That's it! The voice will now work automatically. 🎉

