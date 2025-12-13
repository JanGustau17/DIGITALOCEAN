# DigitalOcean GradientAI Setup Guide

## Quick Setup

1. **Open `.env.local` file** in the root of your project:
   ```
   /Users/mukhammadaliyuldoshev/Desktop/test1/unpack/.env.local
   ```

2. **Add your GradientAI credentials:**
   ```env
   GRADIENT_AI_ACCESS_KEY=your_actual_access_key_here
   GRADIENT_AI_URL=https://your-gradient-ai-endpoint-url
   ```

3. **Replace the placeholder values:**
   - `your_actual_access_key_here` → Your actual GradientAI access key
   - `https://your-gradient-ai-endpoint-url` → Your actual GradientAI API URL

4. **Restart your dev server:**
   ```bash
   npm run dev
   ```

## How It Works

The agent will:
- ✅ Use GradientAI to generate personalized, kid-friendly activities
- ✅ Fall back to hardcoded activities if GradientAI is unavailable
- ✅ Adapt activities based on the child's intensity, words, and impact

## API Format

The agent expects GradientAI to return responses in one of these formats:

**Format 1 (OpenAI-style):**
```json
{
  "choices": [{
    "message": {
      "content": "Take 3 big, slow breaths..."
    }
  }]
}
```

**Format 2 (Direct content):**
```json
{
  "content": "Take 3 big, slow breaths..."
}
```

**Format 3 (Text field):**
```json
{
  "text": "Take 3 big, slow breaths..."
}
```

The code automatically handles all these formats.

## Testing

After setup, test by:
1. Going through the check-in flow
2. Reaching the "Support" step
3. The agent should generate a personalized activity

If GradientAI fails, it will automatically use fallback activities (no error shown to user).

## Troubleshooting

- **Check console logs** for GradientAI API errors
- **Verify credentials** are correct in `.env.local`
- **Ensure URL** includes the full endpoint path (e.g., `https://api.gradient.ai/v1/chat/completions`)
- **Restart server** after changing `.env.local`

