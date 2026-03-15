import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient, getTableName } from '@/lib/supabase-server';
import { generateImageFromTemplate, DatabaseTemplate } from '@/lib/imageGenerator';
import { logAndReturnError } from '@/lib/api-errors';

// Types matching the temp.json structure
interface Trend {
  age: number;
  name: string;
  description: string;
  categoryName: string;
  longevityFactor: number;
  controversyFactor: number;
  technicalDifficultyFactor: number;
}

// Generated content can be an array of strings per content type
interface GeneratedContentItem {
  [contentTypeSlug: string]: string[];
}

interface GenerateContentImagesRequest {
  trend?: Trend; // Optional, can be disregarded
  generatedContent: GeneratedContentItem[];
}

interface GeneratedImage {
  contentTypeSlug: string;
  contentIndex: number; // Index within the content array for this type
  templateId: string;
  templateName: string;
  templateSlug: string;
  imageBase64: string;
}

interface ContentTypeImages {
  contentTypeSlug: string;
  images: GeneratedImage[];
}

interface GenerateContentImagesResponse {
  imagesByContentType: ContentTypeImages[];
  totalImagesGenerated: number;
  errors?: string[];
}

export async function POST(request: NextRequest) {
  const errors: string[] = [];

  console.log('[generate-content-images] POST request received');

  try {
    // Authentication - support both normal requests and internal runbook calls
    console.log('[generate-content-images] Starting authentication...');

    // Check for internal runbook execution header
    const internalUserId = request.headers.get('x-internal-user-id')
    console.log(`[generate-content-images] Internal user ID header: ${internalUserId || 'not present'}`)

    let user
    if (internalUserId) {
      // Internal call from runbook execution - validate user exists
      console.log('[generate-content-images] Authenticating via internal header...')
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(internalUserId)
      if (userError || !userData.user) {
        console.log('[generate-content-images] Invalid internal user:', userError)
        return logAndReturnError('Invalid internal user', 401, { userError, internalUserId })
      }
      user = userData.user
      console.log(`[generate-content-images] Authenticated via internal header: ${user.id}`)
    } else {
      // Normal authenticated request
      console.log('[generate-content-images] Authenticating via session...')
      const supabase = await createClient()
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.log('[generate-content-images] Auth error:', authError.message)
        return logAndReturnError('Authentication error', 401, { authError: authError.message })
      }

      if (!authUser) {
        console.log('[generate-content-images] No user found - returning 401')
        return logAndReturnError('Unauthorized - no user session', 401)
      }

      user = authUser
      console.log(`[generate-content-images] User authenticated via session: ${user.id}`)
    }

    // Parse request body
    console.log('[generate-content-images] Parsing request body...');
    let body: GenerateContentImagesRequest;
    try {
      body = await request.json();
      console.log('[generate-content-images] Request body parsed:', {
        hasTrend: !!body.trend,
        trendName: body.trend?.name,
        contentTypesCount: body.generatedContent?.length,
        contentTypes: body.generatedContent?.map(item => Object.keys(item)).flat()
      });
    } catch (parseError) {
      console.log('[generate-content-images] Failed to parse request body:', parseError);
      return logAndReturnError('Invalid JSON in request body', 400, { parseError });
    }

    if (!body.generatedContent || !Array.isArray(body.generatedContent) || body.generatedContent.length === 0) {
      console.log('[generate-content-images] Missing or invalid generatedContent array');
      return logAndReturnError('Missing or invalid generatedContent array', 400, { received: body.generatedContent });
    }

    // Fetch all content types to build slug -> id mapping
    console.log('[generate-content-images] Fetching content types from database...');
    const { data: contentTypes, error: contentTypesError } = await supabaseAdmin
      .from(getTableName('content_types'))
      .select('id, slug, name');

    if (contentTypesError) {
      console.log('[generate-content-images] Error fetching content types:', contentTypesError);
      return logAndReturnError('Failed to fetch content types from database', 500, { contentTypesError });
    }

    console.log(`[generate-content-images] Found ${contentTypes?.length || 0} content types`);

    // Build a map of content type slug to id
    const contentTypeSlugToId = new Map<string, string>();
    for (const ct of contentTypes || []) {
      contentTypeSlugToId.set(ct.slug, ct.id);
    }
    console.log('[generate-content-images] Content type slug mapping:', Array.from(contentTypeSlugToId.keys()));

    // Fetch all templates with their content type info
    console.log('[generate-content-images] Fetching templates from database...');
    const { data: templates, error: templatesError } = await supabaseAdmin
      .from(getTableName('templates'))
      .select('id, slug, name, visual_style, html_template, width_pixels, height_pixels, content_type_id');

    if (templatesError) {
      console.log('[generate-content-images] Error fetching templates:', templatesError);
      return logAndReturnError('Failed to fetch templates from database', 500, { templatesError });
    }

    console.log(`[generate-content-images] Found ${templates?.length || 0} templates`);

    // Build a map of content type id to templates
    const contentTypeTemplates = new Map<string, DatabaseTemplate[]>();
    for (const template of templates || []) {
      if (!contentTypeTemplates.has(template.content_type_id)) {
        contentTypeTemplates.set(template.content_type_id, []);
      }
      contentTypeTemplates.get(template.content_type_id)!.push(template as DatabaseTemplate);
    }

    // Log template distribution
    console.log('[generate-content-images] Template distribution by content type:');
    for (const [ctId, ctTemplates] of contentTypeTemplates.entries()) {
      const ctSlug = contentTypes?.find(ct => ct.id === ctId)?.slug || 'unknown';
      const withHtml = ctTemplates.filter(t => t.html_template).length;
      console.log(`  - ${ctSlug}: ${ctTemplates.length} templates (${withHtml} with HTML)`);
    }

    // Process each content type in generatedContent
    const imagesByContentType: ContentTypeImages[] = [];
    let totalImagesGenerated = 0;

    console.log('[generate-content-images] Starting image generation loop...');

    for (const contentItem of body.generatedContent) {
      // Each contentItem has one key (the content type slug) with an array of content strings
      const contentTypeSlugs = Object.keys(contentItem);
      console.log(`[generate-content-images] Processing content item with types: ${contentTypeSlugs.join(', ')}`);

      for (const contentTypeSlug of contentTypeSlugs) {
        const contentStrings = contentItem[contentTypeSlug];
        console.log(`[generate-content-images] Content type '${contentTypeSlug}' has ${contentStrings?.length || 0} items`);

        if (!Array.isArray(contentStrings)) {
          const errorMsg = `Invalid content for type ${contentTypeSlug}: expected array`;
          console.log(`[generate-content-images] ${errorMsg}`);
          errors.push(errorMsg);
          continue;
        }

        // Find content type id
        const contentTypeId = contentTypeSlugToId.get(contentTypeSlug);
        if (!contentTypeId) {
          const errorMsg = `Content type not found in database: ${contentTypeSlug}`;
          console.log(`[generate-content-images] ${errorMsg}`);
          errors.push(errorMsg);
          continue;
        }
        console.log(`[generate-content-images] Found content type ID: ${contentTypeId}`);

        // Find templates for this content type
        const templatesForType = contentTypeTemplates.get(contentTypeId) || [];
        console.log(`[generate-content-images] Found ${templatesForType.length} templates for ${contentTypeSlug}`);

        if (templatesForType.length === 0) {
          const errorMsg = `No templates found for content type: ${contentTypeSlug}`;
          console.log(`[generate-content-images] ${errorMsg}`);
          errors.push(errorMsg);
          continue;
        }

        // Filter templates that have HTML templates
        const validTemplates = templatesForType.filter(t => t.html_template);
        console.log(`[generate-content-images] ${validTemplates.length} templates have HTML content`);

        if (validTemplates.length === 0) {
          const errorMsg = `No templates with HTML content found for content type: ${contentTypeSlug}`;
          console.log(`[generate-content-images] ${errorMsg}`);
          errors.push(errorMsg);
          continue;
        }

        // Generate images for each content string using available templates
        const contentTypeImages: GeneratedImage[] = [];

        for (let contentIndex = 0; contentIndex < contentStrings.length; contentIndex++) {
          const contentText = contentStrings[contentIndex];
          console.log(`[generate-content-images] Generating image ${contentIndex + 1}/${contentStrings.length} for ${contentTypeSlug}`);

          // Cycle through templates if there are more content items than templates
          const template = validTemplates[contentIndex % validTemplates.length];
          console.log(`[generate-content-images] Using template: ${template.name} (${template.slug})`);

          try {
            // Prepare template data
            const templateData = {
              text: contentText,
              topic: body.trend?.categoryName || '',
              trendName: body.trend?.name || '',
              trendDescription: body.trend?.description || '',
              // Allow templates to access all content for this type
              allContent: contentStrings,
              contentIndex: contentIndex
            };

            console.log(`[generate-content-images] Calling generateImageFromTemplate...`);
            // Generate image
            const imageBase64 = await generateImageFromTemplate({
              template,
              templateData
            });
            console.log(`[generate-content-images] Image generated successfully (${imageBase64.length} chars)`);

            contentTypeImages.push({
              contentTypeSlug,
              contentIndex,
              templateId: template.id,
              templateName: template.name,
              templateSlug: template.slug,
              imageBase64
            });

            totalImagesGenerated++;
            console.log(`[generate-content-images] Total images generated so far: ${totalImagesGenerated}`);
          } catch (error) {
            const errorMsg = `Failed to generate image for ${contentTypeSlug}[${contentIndex}]: ${error instanceof Error ? error.message : String(error)}`;
            console.log(`[generate-content-images] ERROR: ${errorMsg}`);
            errors.push(errorMsg);
          }
        }

        if (contentTypeImages.length > 0) {
          imagesByContentType.push({
            contentTypeSlug,
            images: contentTypeImages
          });
          console.log(`[generate-content-images] Added ${contentTypeImages.length} images for ${contentTypeSlug}`);
        }
      }
    }

    console.log(`[generate-content-images] Image generation complete. Total: ${totalImagesGenerated}, Errors: ${errors.length}`);

    const response: GenerateContentImagesResponse = {
      imagesByContentType,
      totalImagesGenerated,
      ...(errors.length > 0 && { errors })
    };

    console.log('[generate-content-images] Returning success response');
    return NextResponse.json(response);

  } catch (error) {
    console.error('[generate-content-images] UNEXPECTED ERROR:', error);
    return logAndReturnError(
      error instanceof Error ? error.message : 'Failed to generate content images',
      500,
      { stack: error instanceof Error ? error.stack : undefined }
    );
  }
}

// Optional: GET method for testing/documentation
export async function GET() {
  return NextResponse.json({
    message: 'Generate Content Images API',
    usage: 'POST with { "trend": {...}, "generatedContent": [{ "contentTypeSlug": ["content1", "content2"] }] }',
    example: {
      trend: {
        name: "Example Trend",
        categoryName: "Technology"
      },
      generatedContent: [
        {
          hotTakes: [
            "AI agents sound revolutionary until they spend 45 minutes reasoning...",
            "Venture capital is pouring billions into agents..."
          ]
        },
        {
          aiToolComparisons: [
            "Groq LPU vs NVIDIA H100: 10x throughput..."
          ]
        }
      ]
    }
  });
}
