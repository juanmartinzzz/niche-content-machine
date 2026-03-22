import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createXai } from '@ai-sdk/xai'
import { generateText } from 'ai'

import { createClient, getTableName } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const TARGET_MODEL_IDENTIFIER = 'grok-4-1-fast-reasoning'
const XAI_API_KEY = process.env.XAI_API_KEY

interface GenerateTextRequest {
  prompt?: string
  systemPrompt?: string
  temperature?: number
  topP?: number
  maxOutputTokens?: number
}

interface DbModelRecord {
  id: string
  model_identifier: string
  display_name: string
}

function buildFinalPrompt(prompt: string, systemPrompt?: string): string {
  if (systemPrompt && systemPrompt.trim()) {
    return `${systemPrompt.trim()}\n\n${prompt.trim()}`
  }
  return prompt.trim()
}

function sanitizeNumber(input: unknown): number | undefined {
  return typeof input === 'number' && Number.isFinite(input) ? input : undefined
}

function hashPrompt(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex')
}

async function logGenerationAttempt({
  userId,
  model,
  requestPayload,
  finalPrompt,
  resultText,
  usage,
  success,
  statusCode,
  durationMs,
  error
}: {
  userId: string
  model: DbModelRecord
  requestPayload: Record<string, unknown>
  finalPrompt: string
  resultText: string | null
  usage: unknown
  success: boolean
  statusCode: number
  durationMs: number
  error: string | null
}) {
  const logBase: Record<string, unknown> = {
    user_id: userId,
    endpoint_id: null,
    request_payload: requestPayload,
    final_prompt: finalPrompt,
    response_payload: { text: resultText, usage },
    response_status: statusCode,
    tokens_used: (usage as { totalTokens?: number })?.totalTokens || 0,
    cost_cents: null,
    duration_ms: durationMs
  }

  console.log('[internal/generate-text] request payload', {
    userId,
    modelId: model.id,
    modelIdentifier: model.model_identifier,
    finalPrompt
  })

  try {
    await supabaseAdmin.from(getTableName('ai_request_logs')).insert([{
      ...logBase,
      model_id: model.id
    }])
  } catch (primaryLogError) {
    console.error('[internal/generate-text] primary log insert failed, trying fallback schema', primaryLogError)

    try {
      await supabaseAdmin.from(getTableName('ai_request_logs')).insert([{
        user_id: userId,
        endpoint_id: null,
        request_timestamp: new Date().toISOString(),
        response_timestamp: new Date().toISOString(),
        http_status_code: statusCode,
        request_success: success,
        error_message: error,
        request_payload_hash: hashPrompt(finalPrompt),
        estimated_cost_usd: null,
        response_payload: { text: resultText, usage },
        request_payload: requestPayload
      }])
    } catch (fallbackLogError) {
      console.error('[internal/generate-text] fallback log insert also failed', fallbackLogError)
    }
  }
}

async function resolveInternalUser(request: NextRequest) {
  const internalUserId = request.headers.get('x-internal-user-id')

  if (internalUserId) {
    const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(internalUserId)
    if (error || !userData.user) {
      throw new Error('Invalid internal user')
    }
    return userData.user
  }

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Unauthorized')
  }

  return user
}

async function getConfiguredModel() {
  const { data: model, error } = await supabaseAdmin
    .from(getTableName('ai_models'))
    .select('id, model_identifier, display_name')
    .eq('model_identifier', TARGET_MODEL_IDENTIFIER)
    .eq('is_enabled', true)
    .single()

  if (error || !model) {
    throw new Error(`Configured model not found or disabled: ${TARGET_MODEL_IDENTIFIER}`)
  }

  return model as DbModelRecord
}

export async function POST(request: NextRequest) {
  if (!XAI_API_KEY) {
    console.error('[internal/generate-text] XAI_API_KEY missing')
    return NextResponse.json({ error: 'Server misconfigured: xAI_API_KEY is required' }, { status: 500 })
  }

  const startedAt = Date.now()
  let userId: string | null = null
  let model: DbModelRecord | null = null
  let finalPrompt = ''
  let resultText: string | null = null
  let usage: unknown = null
  let statusCode = 200
  let responseError: string | null = null
  let requestPayload: Record<string, unknown> | null = null
  let success = false

  try {
    const user = await resolveInternalUser(request)
    userId = user.id

    const body = await request.json() as GenerateTextRequest
    const prompt = typeof body.prompt === 'string' ? body.prompt : ''

    if (!prompt.trim()) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }

    model = await getConfiguredModel()

    const systemPrompt = typeof body.systemPrompt === 'string' ? body.systemPrompt : undefined
    const temperature = sanitizeNumber(body.temperature)
    const topP = sanitizeNumber(body.topP)
    const maxOutputTokens = sanitizeNumber(body.maxOutputTokens)

    finalPrompt = buildFinalPrompt(prompt, systemPrompt)
    requestPayload = {
      prompt,
      systemPrompt,
      temperature,
      topP,
      maxOutputTokens,
      model_identifier: model.model_identifier
    }

    const xaiProvider = createXai({
      apiKey: XAI_API_KEY
    })

    const result = await generateText({
      model: xaiProvider(model.model_identifier),
      prompt,
      system: systemPrompt,
      temperature,
      topP,
      ...(maxOutputTokens ? { maxTokens: maxOutputTokens } : {})
    })

    resultText = result.text
    usage = result.usage
    success = true

    return NextResponse.json({
      model: {
        id: model.id,
        modelIdentifier: model.model_identifier,
        displayName: model.display_name
      },
      finalPrompt,
      text: result.text,
      usage: result.usage || null,
      finishReason: result.finishReason || null,
      durationMs: Date.now() - startedAt
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Invalid internal user')) {
      statusCode = 401
    } else {
      statusCode = error && typeof error === 'object' && 'status' in error
        ? Number((error as { status?: number }).status) || 500
        : 500
    }
    responseError = error instanceof Error ? error.message : 'Failed to run internal generate-text'
    return NextResponse.json({ error: responseError }, { status: statusCode })
  } finally {
    if (!userId || !model || !requestPayload) {
      return
    }

    statusCode = statusCode || 500
    usage = usage || {}

    await logGenerationAttempt({
      userId,
      model,
      requestPayload,
      finalPrompt,
      resultText,
      usage,
      success,
      statusCode,
      durationMs: Date.now() - startedAt,
      error: responseError
    })
  }
}
