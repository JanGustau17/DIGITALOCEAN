# Fix Dev Server Issues

## If you're getting 500 errors or cache issues:

### Step 1: Stop the dev server
Press `Ctrl+C` in the terminal where `npm run dev` is running

### Step 2: Clear all caches
```bash
cd /Users/mukhammadaliyuldoshev/Desktop/test1/unpack
rm -rf .next
rm -rf node_modules/.cache
```

### Step 3: Restart dev server
```bash
npm run dev
```

## If issues persist:

### Full clean restart:
```bash
cd /Users/mukhammadaliyuldoshev/Desktop/test1/unpack

# Stop any running processes
pkill -f "next dev"

# Clear everything
rm -rf .next
rm -rf node_modules/.cache

# Restart
npm run dev
```

## Check if it's working:

1. Open browser: `http://localhost:3000`
2. You should see the intro page with:
   - "How are you feeling?" title
   - "Let's check in together" subtitle
   - A Lottie animation
   - "Let's Begin" button

## Common Issues:

- **Port already in use**: Change port with `npm run dev -- -p 3001`
- **Cache corruption**: Always clear `.next` folder
- **Module errors**: Try `rm -rf node_modules && npm install`

