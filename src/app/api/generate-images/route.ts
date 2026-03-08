import { NextRequest, NextResponse } from 'next/server';
import { generateHotTakeImages, ImageGeneratorInput } from '@/lib/imageGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    if (!body.visualStyle) {
      return NextResponse.json(
        { error: 'Missing required field: visualStyle' },
        { status: 400 }
      );
    }

    // Extract visualStyle, pass rest as template data
    const { visualStyle, ...templateData } = body;

    const input: ImageGeneratorInput = {
      template_json: templateData,
      visualStyle: visualStyle,
    };

    // Generate images
    const result = await generateHotTakeImages(input);

    return NextResponse.json(result);

  } catch (error) {
    console.error('API Error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to generate images' },
      { status: 500 }
    );
  }
}

// Optional: GET method for testing
export async function GET() {
  return NextResponse.json({
    message: 'Image Generator API',
    usage: 'POST with { "visualStyle": "minimal|retro|bold|playful", ...templateData }'
  });
}