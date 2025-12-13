# Debugging Voice Issues

## Check Environment Variables

1. **Create `.env.local` file** in the `unpack` directory:
   ```env
   NEXT_PUBLIC_ELEVENLABS_API_KEY=your_actual_api_key_here
   NEXT_PUBLIC_ELEVENLABS_VOICE_ID=ocZQ262SsZb9RIxcQBOj
   ```

2. **Restart the dev server** (this is critical!):
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

3. **Check browser console** (F12):
   - Look for "ElevenLabs Config:" log
   - It should show `hasVoiceId: true` and the voice ID
   - If it shows `NOT SET`, the env vars aren't loading

## Common Issues

### Voice ID Not Working
- Make sure `.env.local` is in the `unpack` directory (not parent folders)
- Make sure variable names start with `NEXT_PUBLIC_`
- Restart dev server after creating/editing `.env.local`
- Check browser console for errors
- Verify your API key has credits/quota

### Buttons Not Clickable
- Check browser console for errors
- Make sure `isProcessing` isn't stuck (should reset after actions)
- Try refreshing the page
- Check if there are any overlay elements blocking clicks

## Test Voice Directly

Open browser console and run:
```javascript
// This will test if the voice ID works
fetch('https://api.elevenlabs.io/v1/text-to-speech/ocZQ262SsZb9RIxcQBOj', {
  method: 'POST',
  headers: {
    'Accept': 'audio/mpeg',
    'Content-Type': 'application/json',
    'xi-api-key': 'YOUR_API_KEY_HERE'
  },
  body: JSON.stringify({
    text: 'Hello, this is a test',
    model_id: 'eleven_monolingual_v1'
  })
})
.then(r => r.blob())
.then(blob => {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();
})
```

If this works, the voice ID is correct. If not, check your API key.

