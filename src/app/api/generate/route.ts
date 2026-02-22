import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient, getTableName } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint_id, prompt_template_id, variables = {} } = body

    if (!endpoint_id || !prompt_template_id) {
      return NextResponse.json({
        error: 'endpoint_id and prompt_template_id are required'
      }, { status: 400 })
    }

    // Fetch endpoint details with model and provider info
    const { data: endpointData, error: endpointError } = await supabaseAdmin
      .from(getTableName('ai_endpoints'))
      .select(`
        *,
        ${getTableName('ai_models')} (
          *,
          ${getTableName('ai_providers')} (*)
        )
      `)
      .eq('id', endpoint_id)
      .eq('is_active', true)
      .single()

    if (endpointError || !endpointData) {
      console.error('Error fetching endpoint:', endpointError)
      return NextResponse.json({ error: 'Endpoint not found or inactive' }, { status: 404 })
    }

    const endpoint = endpointData as any

    // Check if endpoint has associated model data
    if (!endpoint.ai_models) {
      console.error('Endpoint missing model data:', endpoint)
      return NextResponse.json({ error: 'Endpoint configuration is incomplete - missing model data' }, { status: 500 })
    }

    // Fetch prompt template
    const { data: promptTemplate, error: templateError } = await supabaseAdmin
      .from(getTableName('ai_prompt_templates'))
      .select('*')
      .eq('id', prompt_template_id)
      .single()

    if (templateError || !promptTemplate) {
      console.error('Error fetching prompt template:', templateError)
      return NextResponse.json({ error: 'Prompt template not found' }, { status: 404 })
    }

    // Replace variables in the prompt template
    let systemPrompt = promptTemplate.system_prompt
    let userPrompt = promptTemplate.user_prompt_template

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      if (systemPrompt) {
        systemPrompt = systemPrompt.replace(new RegExp(placeholder, 'g'), String(value))
      }
      userPrompt = userPrompt.replace(new RegExp(placeholder, 'g'), String(value))
    })

    // Construct the API request based on the provider
    const provider = endpoint.ai_models.ai_providers
    const baseUrl = provider.base_url.replace(/\/$/, '') // Remove trailing slash
    const apiUrl = `${baseUrl}${endpoint.api_path}`

    // Prepare request body based on common AI API formats
    const requestBody: Record<string, unknown> = {
      model: endpoint.ai_models.model_identifier,
      temperature: endpoint.default_temperature,
      max_tokens: endpoint.default_max_tokens,
      top_p: endpoint.default_top_p,
    }

    // Add messages based on whether we have a system prompt
    const messages = []
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    messages.push({ role: 'user', content: userPrompt })
    requestBody.messages = messages

    // Add structured output if configured
    if (promptTemplate.use_structured_output && promptTemplate.structured_output_schema) {
      // Handle different structured output formats
      if (promptTemplate.structured_output_format === 'json_schema') {
        requestBody.response_format = {
          type: 'json_schema',
          json_schema: promptTemplate.structured_output_schema
        }
      } else if (promptTemplate.structured_output_format === 'pydantic') {
        // For pydantic schemas, we'll pass them as JSON schema for now
        requestBody.response_format = {
          type: 'json_schema',
          json_schema: promptTemplate.structured_output_schema
        }
      }
    }

    console.log('Making AI API call to:', apiUrl)
    console.log('Request body:', JSON.stringify(requestBody, null, 2))

    // Make the API call
    const response = await fetch(apiUrl, {
      method: endpoint.http_method,
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real implementation, you'd add authentication headers here
        // For now, assuming API keys are handled by the provider configuration
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout((provider.global_timeout_seconds || 30) * 1000)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI API error:', response.status, errorText)
      return NextResponse.json({
        error: `AI API error: ${response.status} ${response.statusText}`,
        details: errorText
      }, { status: 502 })
    }

    const aiResponse = await response.json()

    // Log the request for monitoring/analytics
    try {
      await supabaseAdmin
        .from(getTableName('ai_request_logs'))
        .insert([{
          endpoint_id,
          prompt_template_id,
          user_id: user.id,
          request_payload: requestBody,
          response_payload: aiResponse,
          response_status: response.status,
          tokens_used: aiResponse.usage?.total_tokens,
          cost_cents: calculateCost(aiResponse.usage, endpoint.ai_models),
          duration_ms: 0, // Would need to track this properly
          created_at: new Date().toISOString()
        }])
    } catch (logError) {
      console.error('Error logging request:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      response: aiResponse,
      endpoint: {
        id: endpoint.id,
        slug: endpoint.slug,
        model: endpoint.ai_models.display_name,
        provider: provider.name
      },
      prompt_template: {
        id: promptTemplate.id,
        name: promptTemplate.name,
        version: promptTemplate.version
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to calculate cost (simplified)
function calculateCost(usage: { prompt_tokens?: number; completion_tokens?: number }, model: { input_cost_per_million_tokens?: number; output_cost_per_million_tokens?: number }) {
  if (!usage || !model) return null

  const inputTokens = usage.prompt_tokens || 0
  const outputTokens = usage.completion_tokens || 0

  const inputCost = (inputTokens / 1_000_000) * (model.input_cost_per_million_tokens || 0)
  const outputCost = (outputTokens / 1_000_000) * (model.output_cost_per_million_tokens || 0)

  return Math.round((inputCost + outputCost) * 100) // Convert to cents
}