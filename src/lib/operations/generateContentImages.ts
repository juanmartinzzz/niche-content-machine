import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient, getTableName } from '@/lib/supabase-server'
import { generateImageFromTemplate, DatabaseTemplate } from '@/lib/imageGenerator'
import { logAndReturnError } from '@/lib/api-errors'
import { applyTemplateMacros } from '@/utils/templateMacros'

export interface Trend {
  age: number
  name: string
  description: string
  categoryName: string
  longevityFactor: number
  controversyFactor: number
  technicalDifficultyFactor: number
}

type GeneratedContentValues = Record<string, unknown>

interface GeneratedContentItem {
  [contentTypeSlug: string]: GeneratedContentValues[]
}

interface GenerateContentImagesRequest {
  trend?: Trend
  generatedContent: GeneratedContentItem[]
}

interface GeneratedImage {
  contentTypeSlug: string
  contentIndex: number
  templateId: string
  templateName: string
  templateSlug: string
  imageBase64: string
}

interface ContentTypeImages {
  contentTypeSlug: string
  images: GeneratedImage[]
}

interface GenerateContentImagesResponse {
  imagesByContentType: ContentTypeImages[]
  totalImagesGenerated: number
  errors?: string[]
}

function isPlainObject(value: unknown): value is GeneratedContentValues {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function getGenerateContentImagesUsagePayload() {
  return {
    message: 'Generate Content Images API',
    usage: 'POST with { "trend": {...}, "generatedContent": [{ "contentTypeSlug": [{ "property1": "value1" }] }] }',
    example: {
      trend: {
        name: 'Example Trend',
        categoryName: 'Technology'
      },
      generatedContent: [
        {
          hotTakes: [
            {
              statement: 'AI agents sound revolutionary until they spend 45 minutes reasoning...',
              source: 'Industry commentary'
            },
            {
              statement: 'Venture capital is pouring billions into agent frameworks.',
              source: 'Funding update'
            }
          ]
        },
        {
          aiToolComparisons: [
            {
              statement: 'Groq LPU vs NVIDIA H100: 10x throughput.'
            }
          ]
        }
      ]
    }
  }
}

export async function handleGenerateContentImagesPOST(request: NextRequest): Promise<NextResponse> {
  const errors: string[] = []

  console.log('[generate-content-images] POST request received')

  try {
    console.log('[generate-content-images] Starting authentication...')

    const internalUserId = request.headers.get('x-internal-user-id')
    console.log(`[generate-content-images] Internal user ID header: ${internalUserId || 'not present'}`)

    let user
    if (internalUserId) {
      console.log('[generate-content-images] Authenticating via internal header...')
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(internalUserId)
      if (userError || !userData.user) {
        console.log('[generate-content-images] Invalid internal user:', userError)
        return logAndReturnError('Invalid internal user', 401, { userError, internalUserId })
      }
      user = userData.user
      console.log(`[generate-content-images] Authenticated via internal header: ${user.id}`)
    } else {
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

    console.log('[generate-content-images] Parsing request body...')
    let body: GenerateContentImagesRequest
    try {
      body = await request.json()
      console.log('[generate-content-images] Request body parsed:', {
        hasTrend: !!body.trend,
        trendName: body.trend?.name,
        contentTypesCount: body.generatedContent?.length,
        contentTypes: body.generatedContent?.map(item => Object.keys(item)).flat()
      })
    } catch (parseError) {
      console.log('[generate-content-images] Failed to parse request body:', parseError)
      return logAndReturnError('Invalid JSON in request body', 400, { parseError })
    }

    if (!body.generatedContent || !Array.isArray(body.generatedContent) || body.generatedContent.length === 0) {
      console.log('[generate-content-images] Missing or invalid generatedContent array')
      return logAndReturnError('Missing or invalid generatedContent array', 400, { received: body.generatedContent })
    }

    console.log('[generate-content-images] Fetching content types from database...')
    const { data: contentTypes, error: contentTypesError } = await supabaseAdmin
      .from(getTableName('content_types'))
      .select('id, slug, name')

    if (contentTypesError) {
      console.log('[generate-content-images] Error fetching content types:', contentTypesError)
      return logAndReturnError('Failed to fetch content types from database', 500, { contentTypesError })
    }

    console.log(`[generate-content-images] Found ${contentTypes?.length || 0} content types`)

    const contentTypeSlugToId = new Map<string, string>()
    for (const ct of contentTypes || []) {
      contentTypeSlugToId.set(ct.slug, ct.id)
    }
    console.log('[generate-content-images] Content type slug mapping:', Array.from(contentTypeSlugToId.keys()))

    console.log('[generate-content-images] Fetching templates from database...')
    const { data: templates, error: templatesError } = await supabaseAdmin
      .from(getTableName('templates'))
      .select('id, slug, name, visual_style, html_template, width_pixels, height_pixels, content_type_id')

    if (templatesError) {
      console.log('[generate-content-images] Error fetching templates:', templatesError)
      return logAndReturnError('Failed to fetch templates from database', 500, { templatesError })
    }

    console.log(`[generate-content-images] Found ${templates?.length || 0} templates`)

    const contentTypeTemplates = new Map<string, DatabaseTemplate[]>()
    for (const template of templates || []) {
      if (!contentTypeTemplates.has(template.content_type_id)) {
        contentTypeTemplates.set(template.content_type_id, [])
      }
      contentTypeTemplates.get(template.content_type_id)!.push(template as DatabaseTemplate)
    }

    console.log('[generate-content-images] Template distribution by content type:')
    for (const [ctId, ctTemplates] of contentTypeTemplates.entries()) {
      const ctSlug = contentTypes?.find(ct => ct.id === ctId)?.slug || 'unknown'
      const withHtml = ctTemplates.filter(t => t.html_template).length
      console.log(`  - ${ctSlug}: ${ctTemplates.length} templates (${withHtml} with HTML)`)
    }

    const imagesByContentType: ContentTypeImages[] = []
    let totalImagesGenerated = 0

    console.log('[generate-content-images] Starting image generation loop...')

    for (const contentItem of body.generatedContent) {
      const contentTypeSlugs = Object.keys(contentItem)
      console.log(`[generate-content-images] Processing content item with types: ${contentTypeSlugs.join(', ')}`)

      for (const contentTypeSlug of contentTypeSlugs) {
        const contentValues = contentItem[contentTypeSlug]
        console.log(`[generate-content-images] Content type '${contentTypeSlug}' has ${contentValues?.length || 0} items`)

        if (!Array.isArray(contentValues)) {
          const errorMsg = `Invalid content for type ${contentTypeSlug}: expected array`
          console.log(`[generate-content-images] ${errorMsg}`)
          errors.push(errorMsg)
          continue
        }

        const contentTypeId = contentTypeSlugToId.get(contentTypeSlug)
        if (!contentTypeId) {
          const errorMsg = `Content type not found in database: ${contentTypeSlug}`
          console.log(`[generate-content-images] ${errorMsg}`)
          errors.push(errorMsg)
          continue
        }
        console.log(`[generate-content-images] Found content type ID: ${contentTypeId}`)

        const templatesForType = contentTypeTemplates.get(contentTypeId) || []
        console.log(`[generate-content-images] Found ${templatesForType.length} templates for ${contentTypeSlug}`)

        if (templatesForType.length === 0) {
          const errorMsg = `No templates found for content type: ${contentTypeSlug}`
          console.log(`[generate-content-images] ${errorMsg}`)
          errors.push(errorMsg)
          continue
        }

        const validTemplates = templatesForType.filter(
          (t): t is DatabaseTemplate & { html_template: string } => Boolean(t.html_template)
        )
        console.log(`[generate-content-images] ${validTemplates.length} templates have HTML content`)

        if (validTemplates.length === 0) {
          const errorMsg = `No templates with HTML content found for content type: ${contentTypeSlug}`
          console.log(`[generate-content-images] ${errorMsg}`)
          errors.push(errorMsg)
          continue
        }

        const contentTypeImages: GeneratedImage[] = []

        for (let contentIndex = 0; contentIndex < contentValues.length; contentIndex++) {
          const contentData = contentValues[contentIndex]
          console.log(`[generate-content-images] Generating image ${contentIndex + 1}/${contentValues.length} for ${contentTypeSlug}`)

          if (!isPlainObject(contentData)) {
            const errorMsg = `Invalid content item for type ${contentTypeSlug} at index ${contentIndex}: expected object`
            console.log(`[generate-content-images] ${errorMsg}`)
            errors.push(errorMsg)
            continue
          }

          const template = validTemplates[contentIndex % validTemplates.length]
          console.log(`[generate-content-images] Using template: ${template.name} (${template.slug})`)

          try {
            const renderedTemplate = {
              ...template,
              html_template: applyTemplateMacros(template.html_template, contentData)
            }

            console.log('[generate-content-images] Calling generateImageFromTemplate...')
            const imageBase64 = await generateImageFromTemplate({
              template: renderedTemplate,
              templateData: contentData
            })
            console.log(`[generate-content-images] Image generated successfully (${imageBase64.length} chars)`)

            contentTypeImages.push({
              contentTypeSlug,
              contentIndex,
              templateId: template.id,
              templateName: template.name,
              templateSlug: template.slug,
              imageBase64
            })

            totalImagesGenerated++
            console.log(`[generate-content-images] Total images generated so far: ${totalImagesGenerated}`)
          } catch (error) {
            const errorMsg = `Failed to generate image for ${contentTypeSlug}[${contentIndex}]: ${
              error instanceof Error ? error.message : String(error)
            }`
            console.log(`[generate-content-images] ERROR: ${errorMsg}`)
            errors.push(errorMsg)
          }
        }

        if (contentTypeImages.length > 0) {
          imagesByContentType.push({
            contentTypeSlug,
            images: contentTypeImages
          })
          console.log(`[generate-content-images] Added ${contentTypeImages.length} images for ${contentTypeSlug}`)
        }
      }
    }

    console.log(`[generate-content-images] Image generation complete. Total: ${totalImagesGenerated}, Errors: ${errors.length}`)

    const response: GenerateContentImagesResponse = {
      imagesByContentType,
      totalImagesGenerated,
      ...(errors.length > 0 && { errors })
    }

    console.log('[generate-content-images] Returning success response')
    return NextResponse.json(response)
  } catch (error) {
    console.error('[generate-content-images] UNEXPECTED ERROR:', error)
    return logAndReturnError(
      error instanceof Error ? error.message : 'Failed to generate content images',
      500,
      { stack: error instanceof Error ? error.stack : undefined }
    )
  }
}

