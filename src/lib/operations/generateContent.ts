import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient, getTableName } from '@/lib/supabase-server'
import { executeAIOperation, extractStructuredOutput } from '@/lib/ai-utils'

const CONTENT_TYPE_CONFIG: Record<string, { endpoint_slug: string; prompt_template_slug: string }> = {
  hotTakes: {
    endpoint_slug: 'grok-4-1-fast-reasoning',
    prompt_template_slug: 'content-type-software-hot-takes'
  },
  jobMarketState: {
    endpoint_slug: 'grok-4-1-fast-reasoning',
    prompt_template_slug: 'content-type-job-market-state'
  },
  workflowBreakdowns: {
    endpoint_slug: 'grok-4-1-fast-reasoning',
    prompt_template_slug: 'content-type-workflow-breakdowns'
  },
  designPmDiscourse: {
    endpoint_slug: 'grok-4-1-fast-reasoning',
    prompt_template_slug: 'content-type-design-and-pm-discourse'
  },
  salaryTransparency: {
    endpoint_slug: 'grok-4-1-fast-reasoning',
    prompt_template_slug: 'content-type-salary-transparency'
  },
  aiToolComparisons: {
    endpoint_slug: 'grok-4-1-fast-reasoning',
    prompt_template_slug: 'content-type-ai-tool-comparisons'
  }
}

interface Trend {
  categoryName: string
  name: string
  description: string
  age: number
  controversyFactor: number
  technicalDifficultyFactor: number
  longevityFactor: number
  audiences?: {
    primary: string[]
    seniorityRange: 'new grad' | 'junior' | 'mid-level' | 'senior' | 'staff+' | 'all levels'
  }
  toolsAndFrameworks?: string[]
  geographicRelevance?: string[]
}

interface ContentTypeScore {
  contentFitScore: number
  viralPotentialScore: number
  finalScore: number
  rationale: string
}

interface ContentTypeScores {
  hotTakes: ContentTypeScore
  jobMarketState: ContentTypeScore
  workflowBreakdowns: ContentTypeScore
  hiringMarketSignals: ContentTypeScore
  designPmDiscourse: ContentTypeScore
  salaryTransparency: ContentTypeScore
  aiToolComparisons: ContentTypeScore
}

interface GenerateContentRequest {
  trend: Trend
  contentTypeScores: ContentTypeScores
}

export async function handleGenerateContentPOST(request: NextRequest): Promise<NextResponse> {
  try {
    const internalUserId = request.headers.get('x-internal-user-id')

    let user
    if (internalUserId) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(internalUserId)
      if (userError || !userData.user) {
        return NextResponse.json({ error: 'Invalid internal user' }, { status: 401 })
      }
      user = userData.user
    } else {
      const supabase = await createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      user = authUser
    }

    const body: GenerateContentRequest = await request.json()
    const { trend, contentTypeScores } = body

    const sortedContentTypes = Object.entries(contentTypeScores)
      .sort(([, a], [, b]) => b.finalScore - a.finalScore)
      .slice(0, 2)

    if (sortedContentTypes.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 content types with finalScore' },
        { status: 400 }
      )
    }

    const contentPromises = sortedContentTypes.map(async ([contentType, scores]: [string, ContentTypeScore]) => {
      const config = CONTENT_TYPE_CONFIG[contentType]
      if (!config) {
        throw new Error(`No configuration found for content type: ${contentType}`)
      }

      const { data: endpoint, error: endpointError } = await supabaseAdmin
        .from(getTableName('ai_endpoints'))
        .select('id')
        .eq('slug', config.endpoint_slug)
        .eq('is_active', true)
        .single()

      if (endpointError || !endpoint) {
        throw new Error(`Endpoint not found for content type: ${contentType}`)
      }

      const { data: promptTemplate, error: templateError } = await supabaseAdmin
        .from(getTableName('ai_prompt_templates'))
        .select('id, use_structured_output')
        .eq('slug', config.prompt_template_slug)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single()

      if (templateError || !promptTemplate) {
        throw new Error(`Prompt template not found for content type: ${contentType}`)
      }

      const result = await executeAIOperation({
        endpoint_id: endpoint.id,
        prompt_template_id: promptTemplate.id,
        variables: { trend },
        user_id: user.id
      })

      return extractStructuredOutput(result, promptTemplate)
    })

    const generatedContent = await Promise.all(contentPromises)

    return NextResponse.json({
      trend,
      generatedContent
    })
  } catch (error: unknown) {
    console.error('API error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

