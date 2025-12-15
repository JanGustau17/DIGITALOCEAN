// OpenAI Image Generation Helper
// Generates single collage-style poster image for activities

// Config flags
const GENERATE_STEP_IMAGES = process.env.GENERATE_STEP_IMAGES !== 'false';
const IMAGE_TIMEOUT_MS = parseInt(process.env.OPENAI_IMAGE_TIMEOUT_MS || '15000', 10);
const MAX_RETRIES = 2; // Reduced from 4 to 2

// In-memory cache (server-side) - keyed by variationNonce
const imageCache = new Map<string, string>();

// Exponential backoff delays for retries (ms) - reduced delays
const RETRY_DELAYS = [800, 1600];

// Retryable HTTP status codes
const RETRYABLE_STATUSES = [500, 502, 503, 504];

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Timeout wrapper
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Image generation timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

// Generate single collage-style poster image with 3 panels
export async function generateActivityPoster(
  steps: Array<{ instruction: string }>,
  variationNonce: string,
  activityType: string,
  retryCount = 0
): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Check cache first
  if (imageCache.has(variationNonce)) {
    const cached = imageCache.get(variationNonce)!;
    console.log(`💾 Cache hit for activity poster (nonce: ${variationNonce.substring(0, 8)})`);
    return cached;
  }

  // Build collage prompt with 3 panels
  const step1Desc = steps[0]?.instruction || 'getting ready';
  const step2Desc = steps[1]?.instruction || 'main action';
  const step3Desc = steps[2]?.instruction || 'ending';

  const enhancedPrompt = `Cartoon child character illustration, educational poster style like "BREATHING EXERCISES FOR KIDS" poster. THREE horizontal panels side-by-side. Panel 1: ${step1Desc}. Panel 2: ${step2Desc}. Panel 3: ${step3Desc}. Same friendly cartoon child character demonstrating each action clearly in all three panels. Simple line drawing cartoon style. White background. Soft pastel colors. Friendly child demonstrating the action clearly. Cheerful expression. Educational poster illustration. Big, clear shapes. No text, no numbers, no labels, no "Step 1" or "Step 2" or "Step 3". Pure visual illustration only. Children's workbook style. Style variation: ${variationNonce.substring(0, 16)}`;

  const startTime = Date.now();

  try {
    if (retryCount > 0) {
      console.log(`🔄 Retry ${retryCount}/${MAX_RETRIES} for activity poster`);
    } else {
      console.log(`🖼️ Generating activity poster (steps: ${step1Desc.substring(0, 20)}...)`);
    }

    const fetchPromise = fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: '1792x1024', // Wide format for better 3-panel horizontal layout
        quality: 'hd', // Higher quality for better illustrations
      }),
      cache: 'no-store',
    });

    const response = await withTimeout(fetchPromise, IMAGE_TIMEOUT_MS);

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text();
      
      // Check if retryable
      if (RETRYABLE_STATUSES.includes(status) && retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        console.log(`⏳ Retryable error ${status}, waiting ${delay}ms before retry ${retryCount + 1}/${MAX_RETRIES}`);
        await sleep(delay);
        return generateActivityPoster(steps, variationNonce, activityType, retryCount + 1);
      }
      
      // Non-retryable or max retries reached
      console.error(`❌ OpenAI Image API error (${status}) after ${retryCount} retries, duration: ${duration}ms`);
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText.substring(0, 200) };
      }
      throw new Error(`OpenAI Image API error: ${status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;
    
    if (!imageUrl) {
      console.error('❌ No image URL in response');
      throw new Error('No image URL in response');
    }

    // Convert URL to base64 data URL
    const imageResponse = await fetch(imageUrl, { cache: 'no-store' });
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    const blob = await imageResponse.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = blob.type || 'image/png';
    
    const result = `data:${mimeType};base64,${base64}`;
    
    // Cache the result
    imageCache.set(variationNonce, result);
    
    console.log(`✅ Activity poster generated (${duration}ms, retries: ${retryCount}, preview: ${result.substring(0, 30)}...)`);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Check if timeout
    if (errorMsg.includes('timeout')) {
      console.error(`⏱️ Image generation timeout after ${duration}ms`);
    } else {
      console.error(`❌ Error generating activity poster (${duration}ms, retries: ${retryCount}):`, errorMsg.substring(0, 100));
    }
    
    throw error;
  }
}

// Generate activity poster async (for progressive loading)
export async function generateActivityPosterAsync(
  steps: Array<{ instruction: string }>,
  variationNonce: string,
  activityType: string
): Promise<string | null> {
  try {
    return await generateActivityPoster(steps, variationNonce, activityType);
  } catch (error) {
    console.error('Failed to generate activity poster async:', error);
    return null; // Return null on failure, UI will show placeholder
  }
}

// Fallback placeholder SVG for activity poster (no step numbers)
export function getActivityPosterPlaceholder(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 200" width="600" height="200">
    <!-- Panel 1 -->
    <rect x="0" y="0" width="200" height="200" fill="#E3F2FD" stroke="#90CAF9" stroke-width="2"/>
    <circle cx="100" cy="80" r="25" fill="#FFB74D"/>
    <path d="M 70 120 Q 100 140 130 120" stroke="#FFB74D" stroke-width="8" fill="none" stroke-linecap="round"/>
    
    <!-- Panel 2 -->
    <rect x="200" y="0" width="200" height="200" fill="#F3E5F5" stroke="#CE93D8" stroke-width="2"/>
    <circle cx="300" cy="70" r="20" fill="#FFB74D"/>
    <path d="M 280 100 Q 300 120 320 100" stroke="#FFB74D" stroke-width="6" fill="none" stroke-linecap="round"/>
    <ellipse cx="300" cy="130" rx="25" ry="35" fill="#81C784"/>
    
    <!-- Panel 3 -->
    <rect x="400" y="0" width="200" height="200" fill="#E8F5E9" stroke="#A5D6A7" stroke-width="2"/>
    <circle cx="500" cy="75" r="22" fill="#FFB74D"/>
    <path d="M 475 105 Q 500 125 525 105" stroke="#FFB74D" stroke-width="7" fill="none" stroke-linecap="round"/>
    <rect x="488" y="140" width="24" height="35" rx="4" fill="#81C784"/>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// Legacy functions (kept for compatibility, but deprecated)
export function getFallbackSVG(index: number): string {
  const svgs = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <circle cx="100" cy="100" r="80" fill="#E3F2FD" stroke="#90CAF9" stroke-width="3"/>
      <circle cx="100" cy="80" r="25" fill="#FFB74D"/>
      <path d="M 70 120 Q 100 140 130 120" stroke="#FFB74D" stroke-width="8" fill="none" stroke-linecap="round"/>
      <rect x="85" y="145" width="30" height="40" rx="5" fill="#81C784"/>
    </svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <circle cx="100" cy="100" r="80" fill="#F3E5F5" stroke="#CE93D8" stroke-width="3"/>
      <circle cx="100" cy="70" r="20" fill="#FFB74D"/>
      <path d="M 80 100 Q 100 120 120 100" stroke="#FFB74D" stroke-width="6" fill="none" stroke-linecap="round"/>
      <ellipse cx="100" cy="130" rx="25" ry="35" fill="#81C784"/>
      <path d="M 70 110 L 85 125 M 130 110 L 115 125" stroke="#81C784" stroke-width="5" stroke-linecap="round"/>
    </svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <circle cx="100" cy="100" r="80" fill="#E8F5E9" stroke="#A5D6A7" stroke-width="3"/>
      <circle cx="100" cy="75" r="22" fill="#FFB74D"/>
      <path d="M 75 105 Q 100 125 125 105" stroke="#FFB74D" stroke-width="7" fill="none" stroke-linecap="round"/>
      <rect x="88" y="140" width="24" height="35" rx="4" fill="#81C784"/>
      <circle cx="95" cy="155" r="3" fill="#4CAF50"/>
      <circle cx="105" cy="155" r="3" fill="#4CAF50"/>
    </svg>`,
  ];
  return `data:image/svg+xml;base64,${Buffer.from(svgs[index % svgs.length]).toString('base64')}`;
}

// Clear cache (useful for testing)
export function clearImageCache(): void {
  imageCache.clear();
  console.log('🗑️ Image cache cleared');
}
