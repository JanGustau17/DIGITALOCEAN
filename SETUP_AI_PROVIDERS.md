# Setup AI Providers - Quick Guide

## 🚀 Recommended: OpenAI GPT-4

### Step 1: Get API Key
1. Go to: https://platform.openai.com/api-keys
2. Sign up/login
3. Create a new API key
4. Copy it (starts with `sk-`)

### Step 2: Add to `.env.local`
```env
OPENAI_API_KEY=sk-your-actual-key-here
```

### Step 3: Restart Server
```bash
npm run dev
```

**That's it!** The app will automatically use OpenAI.

---

## 🎯 Alternative: Anthropic Claude

### Step 1: Get API Key
1. Go to: https://console.anthropic.com/
2. Sign up/login
3. Create a new API key
4. Copy it (starts with `sk-ant-`)

### Step 2: Add to `.env.local`
```env
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

### Step 3: Restart Server

---

## 🔄 Keep GradientAI

If you want to keep using GradientAI, just make sure `.env.local` has:
```env
GRADIENT_AI_ACCESS_KEY=your_key
GRADIENT_AI_URL=https://your-url
```

---

## 📊 Priority Order

The app tries providers in this order:
1. **OpenAI** (if `OPENAI_API_KEY` exists)
2. **Anthropic** (if `ANTHROPIC_API_KEY` exists)
3. **GradientAI** (if both `GRADIENT_AI_ACCESS_KEY` and `GRADIENT_AI_URL` exist)
4. **Smart Fallback** (if none are configured)

---

## 💰 Cost Estimates

- **OpenAI GPT-4o-mini**: ~$0.01-0.03 per request (very affordable)
- **Anthropic Claude Haiku**: ~$0.01-0.02 per request
- **GradientAI**: Depends on your plan

For 100 kids checking in per day = ~$1-3/month

---

## ✅ Testing

After setup:
1. Go through check-in flow
2. Reach "Support" step
3. You should see personalized, human-like responses!

Check browser console for any errors.

