import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient, getTableName } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data: steps, error } = await supabaseAdmin
      .from(getTableName('ai_runbook_steps'))
      .select('*')
      .eq('runbook_id', id)
      .order('step_order', { ascending: true })

    if (error) {
      console.error('Error fetching runbook steps:', error)
      return NextResponse.json({ error: 'Failed to fetch runbook steps' }, { status: 500 })
    }

    return NextResponse.json(steps)
  } catch (error) {
    console.error('API error in GET /api/runbooks/[id]/steps:', error)

    // Ensure we always return a proper error response
    if (error instanceof Error) {
      return NextResponse.json({
        error: `Server error: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      error: 'Internal server error occurred'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate Content-Type header
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({
        error: 'Content-Type must be application/json'
      }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Validate runbook ID format
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json({
        error: 'Invalid runbook ID'
      }, { status: 400 })
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Invalid JSON in request body:', parseError)
      return NextResponse.json({
        error: 'Invalid JSON in request body'
      }, { status: 400 })
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({
        error: 'Request body must be a valid JSON object'
      }, { status: 400 })
    }

    const {
      step_name,
      description,
      step_type,
      prompt_template_id,
      endpoint_id,
      timeout_seconds,
      retry_count,
      retry_delay_seconds,
      // Simple endpoint configuration (base method and URL)
      http_method,
      endpoint_url,
      // Advanced endpoint configuration (enhancements like headers, body templates, response mapping)
      endpoint_config
    } = body

    // Validate step_name
    if (!step_name || typeof step_name !== 'string' || step_name.trim() === '') {
      return NextResponse.json({
        error: 'step_name is required and must be a non-empty string'
      }, { status: 400 })
    }

    const validStepTypes = ['ai_operation', 'endpoint_call']
    const finalStepType = step_type || 'ai_operation'

    if (!validStepTypes.includes(finalStepType)) {
      return NextResponse.json({
        error: `Invalid step_type. Must be one of: ${validStepTypes.join(', ')}`
      }, { status: 400 })
    }

    // Validate step type specific requirements

    if (finalStepType === 'ai_operation') {
      if (!prompt_template_id || typeof prompt_template_id !== 'string' || prompt_template_id.trim() === '') {
        return NextResponse.json({
          error: 'prompt_template_id is required and must be a valid non-empty string for ai_operation steps'
        }, { status: 400 })
      }
      if (!endpoint_id || typeof endpoint_id !== 'string' || endpoint_id.trim() === '') {
        return NextResponse.json({
          error: 'endpoint_id is required and must be a valid non-empty string for ai_operation steps'
        }, { status: 400 })
      }

      // Validate UUID format for IDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(prompt_template_id)) {
        return NextResponse.json({
          error: 'prompt_template_id must be a valid UUID'
        }, { status: 400 })
      }
      if (!uuidRegex.test(endpoint_id)) {
        return NextResponse.json({
          error: 'endpoint_id must be a valid UUID'
        }, { status: 400 })
      }
    } else if (finalStepType === 'endpoint_call') {
      // Check if using simple configuration
      const hasSimpleConfig = http_method && endpoint_url && http_method.trim() !== '' && endpoint_url.trim() !== ''
      const hasAdvancedConfig = endpoint_config

      if (!hasSimpleConfig && !hasAdvancedConfig) {
        return NextResponse.json({
          error: 'http_method + endpoint_url are required for endpoint_call steps. endpoint_config is optional for advanced features.'
        }, { status: 400 })
      }

      // Validate simple configuration
      if (hasSimpleConfig) {
        const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
        if (!validMethods.includes(http_method.toUpperCase())) {
          return NextResponse.json({
            error: `Invalid HTTP method. Must be one of: ${validMethods.join(', ')}`
          }, { status: 400 })
        }

        // Validate URL format - allow both absolute and relative URLs
        try {
          if (endpoint_url.startsWith('http://') || endpoint_url.startsWith('https://')) {
            // Absolute URL
            new URL(endpoint_url)
          } else if (endpoint_url.startsWith('/')) {
            // Relative URL - valid if it starts with /
            // Additional validation could be added here if needed
          } else {
            // Invalid format
            throw new Error('URL must be absolute (http/https) or relative (starting with /)')
          }
        } catch (urlError) {
          return NextResponse.json({
            error: 'endpoint_url must be a valid absolute URL (starting with http:// or https://) or relative URL (starting with /)'
          }, { status: 400 })
        }
      }

      // Validate advanced configuration (legacy)
      if (hasAdvancedConfig && !hasSimpleConfig) {
        const { method, url } = endpoint_config
        if (!method || !url) {
          return NextResponse.json({
            error: 'endpoint_config must include method and url for endpoint_call steps'
          }, { status: 400 })
        }

        const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
        if (!validMethods.includes(method.toUpperCase())) {
          return NextResponse.json({
            error: `Invalid HTTP method. Must be one of: ${validMethods.join(', ')}`
          }, { status: 400 })
        }
      }
    }

    // Get the next step order
    const { data: existingSteps } = await supabaseAdmin
      .from(getTableName('ai_runbook_steps'))
      .select('step_order')
      .eq('runbook_id', id)
      .order('step_order', { ascending: false })
      .limit(1)

    const nextStepOrder = existingSteps && existingSteps.length > 0
      ? existingSteps[0].step_order + 1
      : 1

    const { data, error } = await supabaseAdmin
      .from(getTableName('ai_runbook_steps'))
      .insert([{
        runbook_id: id,
        step_name,
        description: description || null,
        step_type: finalStepType,
        prompt_template_id: finalStepType === 'ai_operation' ? prompt_template_id : null,
        endpoint_id: finalStepType === 'ai_operation' ? endpoint_id : null,
        step_order: nextStepOrder,
        timeout_seconds: timeout_seconds ?? 300,
        retry_count: retry_count ?? 0,
        retry_delay_seconds: retry_delay_seconds ?? 5,
        // Simple endpoint configuration
        http_method: finalStepType === 'endpoint_call' && http_method ? http_method : null,
        endpoint_url: finalStepType === 'endpoint_call' && endpoint_url ? endpoint_url : null,
        // Advanced endpoint configuration (for complex scenarios)
        endpoint_config: finalStepType === 'endpoint_call' && endpoint_config ? endpoint_config : null
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating runbook step:', error)
      return NextResponse.json({ error: 'Failed to create runbook step' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('🚨 ERROR in POST /api/runbooks/[id]/steps:', error)

    // Ensure we always return a proper error response
    try {
      if (error instanceof Error) {
        return NextResponse.json({
          error: `Server error: ${error.message}`
        }, { status: 500 })
      }

      return NextResponse.json({
        error: 'Internal server error occurred'
      }, { status: 500 })
    } catch (responseError) {
      console.error('🚨 EVEN RESPONSE CREATION FAILED:', responseError)
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}