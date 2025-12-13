# ElevenLabs Troubleshooting Guide

## Common Issues

### 1. "ElevenLabs API key or Voice ID not configured"

**Solution:**
1. Create `.env.local` file in the `unpack` directory (same level as `package.json`)
2. Add your credentials:
   ```env
   NEXT_PUBLIC_ELEVENLABS_API_KEY=your_key_here
   NEXT_PUBLIC_ELEVENLABS_VOICE_ID=your_voice_id_here
   ```
3. **Restart the dev server** (this is critical!)
4. The app will automatically use browser speech if ElevenLabs fails

### 2. Voice Not Speaking

**Check:**
- ✅ `.env.local` file exists in the correct location
- ✅ File is named exactly `.env.local` (not `.env` or `.env.example`)
- ✅ No extra spaces around the `=` sign
- ✅ Dev server was restarted after creating/editing `.env.local`
- ✅ Browser console shows no errors
- ✅ Mute button (top-right) is not active
- ✅ Browser allows audio (check browser settings)

### 3. CORS Errors

If you see CORS errors in the console:
- ElevenLabs API should work from the browser
- Check that your API key is valid
- Verify your ElevenLabs account has credits/quota

### 4. Audio Not Playing

**Check:**
- Browser audio is not muted
- System volume is up
- No other audio is blocking playback
- Try a different browser

### 5. Environment Variables Not Working

**For Next.js:**
- Variables must start with `NEXT_PUBLIC_` to be accessible in the browser
- File must be named `.env.local` (not `.env`)
- Server must be restarted after changes
- Check that variables are being read: add `console.log(process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY)` temporarily

## Testing

1. **Test without ElevenLabs**: Remove or comment out the env vars - should fall back to browser speech
2. **Test with ElevenLabs**: Add correct credentials and restart - should use ElevenLabs voice
3. **Test mute button**: Click the volume icon in top-right - should stop all speech

## Debug Mode

Open browser console (F12) to see:
- Warning messages if ElevenLabs is not configured
- Error messages if API calls fail
- Fallback to browser speech notifications

## Still Not Working?

1. Check the browser console for specific error messages
2. Verify your ElevenLabs API key works by testing it directly:
   ```bash
   curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID" \
     -H "xi-api-key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"text": "test"}'
   ```
3. Make sure you're using the correct Voice ID (not the voice name)

