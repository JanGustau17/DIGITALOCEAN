# Quick Fix Guide

## If Nothing is Working

### 1. Stop All Running Servers
```bash
# Press Ctrl+C in all terminal windows running npm run dev
```

### 2. Clean Install
```bash
cd unpack
rm -rf node_modules package-lock.json
npm install
```

### 3. Create .env.local
Create file `unpack/.env.local`:
```env
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_api_key_here
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=ocZQ262SsZb9RIxcQBOj
```

### 4. Start Fresh
```bash
npm run dev
```

### 5. Open Browser
Go to: http://localhost:3000

### 6. Check Browser Console
Press F12 and look for errors

## Common Issues

**App won't start?**
- Make sure you're in the `unpack` directory
- Make sure port 3000 is not in use
- Check for syntax errors in console

**Buttons don't work?**
- Check browser console for JavaScript errors
- Make sure JavaScript is enabled
- Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

**Voice doesn't work?**
- Check browser console for "ElevenLabs Config:" log
- Make sure .env.local exists and server was restarted
- Voice will fallback to browser speech if ElevenLabs fails

## Still Not Working?

Tell me:
1. What error messages you see (browser console)
2. What happens when you click buttons
3. Does the page load at all?

