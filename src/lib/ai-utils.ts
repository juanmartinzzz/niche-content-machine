import { supabaseAdmin } from '@/lib/supabase-admin'
import { getTableName } from '@/lib/supabase-server'

export interface AIOperationParams {
  endpoint_id: string
  prompt_template_id: string
  variables?: Record<string, unknown>
  arbitrary_input?: string
  user_id: string
}

export interface AIOperationResult {
  response: any
  endpoint: {
    id: string
    slug: string
    model: string
    provider: string
  }
  prompt_template: {
    id: string
    name: string
    version: string | null
  }
}

export async function executeAIOperation(params: AIOperationParams): Promise<AIOperationResult> {
  const { endpoint_id, prompt_template_id, variables = {}, arbitrary_input, user_id } = params

  // Fetch endpoint details with model and provider info
  const { data: endpointData, error: endpointError } = await supabaseAdmin
    .from(getTableName('ai_endpoints'))
    .select(`
      *,
      ai_models:${getTableName('ai_models')} (
        *,
        ai_providers:${getTableName('ai_providers')} (*)
      )
    `)
    .eq('id', endpoint_id)
    .eq('is_active', true)
    .single()

  if (endpointError || !endpointData) {
    throw new Error('Endpoint not found or inactive')
  }

  const endpoint = endpointData as any

  // Check if endpoint has associated model data
  if (!endpoint.ai_models) {
    throw new Error('Endpoint configuration is incomplete - missing model data')
  }

  // Fetch prompt template
  const { data: promptTemplate, error: templateError } = await supabaseAdmin
    .from(getTableName('ai_prompt_templates'))
    .select('*')
    .eq('id', prompt_template_id)
    .single()

  if (templateError || !promptTemplate) {
    throw new Error('Prompt template not found')
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

  // Append arbitrary input to the user prompt if provided
  if (arbitrary_input && arbitrary_input.trim()) {
    userPrompt += '\n\n' + arbitrary_input.trim()
  }

  // Construct the API request based on the provider
  const provider = endpoint.ai_models.ai_providers
  const baseUrl = provider.base_url.replace(/\/$/, '') // Remove trailing slash
  const apiUrl = `${baseUrl}${endpoint.api_path}`

  // Prepare request body based on common AI API formats
  const requestBody: Record<string, unknown> = {
    model: endpoint.ai_models.model_identifier,
  }

  // Only include parameters if they have valid values (not null)
  if (endpoint.default_temperature !== null && endpoint.default_temperature !== undefined) {
    requestBody.temperature = endpoint.default_temperature
  }
  if (endpoint.default_max_tokens !== null && endpoint.default_max_tokens !== undefined) {
    requestBody.max_tokens = endpoint.default_max_tokens
  }
  if (endpoint.default_top_p !== null && endpoint.default_top_p !== undefined) {
    requestBody.top_p = endpoint.default_top_p
  }

  // Add messages/input based on the provider and endpoint
  const messageArray = []
  if (systemPrompt) {
    messageArray.push({ role: 'system', content: systemPrompt })
  }
  messageArray.push({ role: 'user', content: userPrompt })

  // xAI's /v1/responses endpoint uses 'input' instead of 'messages'
  if (provider.base_url.includes('api.x.ai') && endpoint.api_path === '/responses') {
    requestBody.input = messageArray
    // xAI responses endpoint requires explicit text format specification
    if (!requestBody.text) {
      requestBody.text = { format: { type: 'text' } }
    }
  } else {
    requestBody.messages = messageArray
  }

  // Add structured output if configured
  if (promptTemplate.use_structured_output && promptTemplate.structured_output_schema) {
    // Handle different providers and their structured output formats
    if (provider.base_url.includes('api.x.ai') && endpoint.api_path === '/responses') {
      // xAI's /responses endpoint uses text.format for structured outputs
      let schemaToUse = promptTemplate.structured_output_schema

      // For xAI, we need JSON Schema format
      if (promptTemplate.structured_output_format === 'json_schema') {
        // Schema is already a JSON object
        schemaToUse = promptTemplate.structured_output_schema
      } else {
        // For Pydantic/Zod formats, we currently don't support conversion to JSON Schema
        throw new Error(`xAI endpoints currently only support JSON Schema format for structured outputs. Please update your prompt template to use 'json_schema' format instead of '${promptTemplate.structured_output_format}'.`)
      }

      requestBody.text = {
        format: {
          type: 'json_schema',
          name: 'structured_output',
          schema: schemaToUse,
          strict: true
        }
      }
    } else {
      // OpenAI-style response_format for other providers
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
  }

  console.log('Making AI API call to:', apiUrl)
  console.log('Request body:', JSON.stringify(requestBody, null, 2))

  // Prepare headers with authentication
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add authentication for xAI provider
  if (provider.base_url.includes('api.x.ai')) {
    const apiKey = process.env.GROK_API_KEY
    if (!apiKey) {
      throw new Error('GROK_API_KEY environment variable is required for xAI provider')
    }
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  // Make the API call
  const response = await fetch(apiUrl, {
    method: endpoint.http_method,
    headers,
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout((provider.global_timeout_seconds || 30) * 1000)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('AI API error:', response.status, errorText)
    throw new Error(`AI API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const aiResponse = await response.json()

  // Log the request for monitoring/analytics
  try {
    await supabaseAdmin
      .from(getTableName('ai_request_logs'))
      .insert([{
        endpoint_id,
        prompt_template_id,
        user_id,
        request_payload: requestBody,
        response_payload: aiResponse,
        response_status: response.status,
        tokens_used: aiResponse.usage?.total_tokens,
        cost_cents: calculateCost(aiResponse.usage, endpoint.ai_models),
        duration_ms: 0, // Would need to track this properly
        arbitrary_input: arbitrary_input || null,
        created_at: new Date().toISOString()
      }])
  } catch (logError) {
    console.error('Error logging request:', logError)
    // Don't fail the request if logging fails
  }

  return {
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