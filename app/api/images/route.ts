import { NextRequest, NextResponse } from 'next/server';
import { ImageGenerationRequest, ImageGenerationResponse } from '@/lib/types';
import { generateActivityPosterAsync, getActivityPosterPlaceholder } from '@/lib/openaiImages';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { steps, variationNonce, activityType }: { steps: Array<{ instruction: string }>; variationNonce: string; activityType?: string } = body;

    if (!steps || !variationNonce || !Array.isArray(steps) || steps.length !== 3) {
      return NextResponse.json(
        { error: 'Must provide steps array (length 3) and variationNonce' },
        { status: 400 }
      );
    }

    try {
      const imageUrl = await generateActivityPosterAsync(
        steps,
        variationNonce,
        activityType || 'breathing'
      );

      if (imageUrl) {
        return NextResponse.json({ imageUrl } as ImageGenerationResponse, {
          headers: { 'Cache-Control': 'no-store' }
        });
      } else {
        // Return placeholder on failure
        return NextResponse.json({ 
          imageUrl: getActivityPosterPlaceholder() 
        } as ImageGenerationResponse, {
          headers: { 'Cache-Control': 'no-store' }
        });
      }
    } catch (error) {
      console.error('Image generation error:', error);
      return NextResponse.json({ 
        imageUrl: getActivityPosterPlaceholder() 
      } as ImageGenerationResponse, {
        headers: { 'Cache-Control': 'no-store' }
      });
    }
  } catch (error) {
    console.error('Images route error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
