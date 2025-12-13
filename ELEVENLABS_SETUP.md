# ElevenLabs Setup Guide

## Quick Setup

1. **Create `.env.local` file** in the `unpack` directory:
   ```env
   NEXT_PUBLIC_ELEVENLABS_API_KEY=your_actual_api_key_here
   NEXT_PUBLIC_ELEVENLABS_VOICE_ID=your_actual_voice_id_here
   ```

2. **Get your credentials** from [ElevenLabs](https://elevenlabs.io/):
   - Sign up or log in
   - Go to your profile/settings
   - Copy your API key
   - Go to Voices section and copy a Voice ID

3. **Restart the dev server**:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

## How It Works

- **Automatic Speech**: The app automatically speaks all text that appears on screen
- **Step Transitions**: When you move between steps, the voice explains what to do
- **Button Feedback**: When you select words or options, the voice confirms your selection
- **Activity Instructions**: Support activities are read aloud automatically
- **Smart Delays**: Buttons wait for speech to complete before advancing

## Mute/Unmute

- Click the volume button in the top-right corner to toggle voice on/off
- When muted, all speech is disabled
- When unmuted, speech resumes automatically

## Troubleshooting

**No voice?**
1. Check that `.env.local` exists in the `unpack` directory (not in parent folders)
2. Verify your API key and Voice ID are correct (no extra spaces)
3. Restart the dev server after creating/editing `.env.local`
4. Check browser console for errors
5. Make sure browser allows audio (check browser settings)

**Voice not working?**
- The app falls back to browser speech synthesis if ElevenLabs fails
- Check browser console for error messages
- Verify your ElevenLabs account has credits/quota

**Voice too fast/slow?**
- Edit `lib/elevenlabs.ts`
- Change `rate` value (lower = slower, range: 0.5-1.0)
- Change `pitch` value (lower = deeper, range: 0.5-2.0)

**Buttons moving too fast?**
- Edit `app/page.tsx`
- Find `handleWithDelay` function
- Increase the delay (currently 500ms) to wait longer for speech

## Environment Variables

**Important**: In Next.js, environment variables that start with `NEXT_PUBLIC_` are exposed to the browser. This is required for the client-side ElevenLabs integration.

**Security Note**: These credentials will be visible in the browser. For production, consider using a server-side API route instead.

