import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient, getTableName } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
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
    const body = await request.json()
    const { initial_input } = body

    // Start runbook execution
    const { data: runbookExecution, error: execError } = await supabaseAdmin
      .from(getTableName('ai_runbook_executions'))
      .insert([{
        runbook_id: id,
        execution_status: 'running',
        initial_input: initial_input || null,
        started_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (execError) {
      console.error('Error creating runbook execution:', execError)
      return NextResponse.json({ error: 'Failed to start runbook execution' }, { status: 500 })
    }

    // Execute runbook asynchronously
    executeRunbook(runbookExecution.id, initial_input || {})

    return NextResponse.json({
      execution_id: runbookExecution.id,
      status: 'running'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function executeRunbook(executionId: string, initialInput: Record<string, unknown>) {
  try {
    // Get runbook steps
    const { data: steps, error: stepsError } = await supabaseAdmin
      .from(getTableName('ai_runbook_steps'))
      .select('*')
      .eq('runbook_id', (await supabaseAdmin
        .from(getTableName('ai_runbook_executions'))
        .select('runbook_id')
        .eq('id', executionId)
        .single()).data?.runbook_id)
      .order('step_order', { ascending: true })

    if (stepsError) {
      console.error('Error fetching steps:', stepsError)
      await updateExecutionStatus(executionId, 'failed', null, 'Failed to fetch steps')
      return
    }

    let currentInput = initialInput
    let finalOutput = null

    // Execute steps sequentially
    for (const step of steps || []) {
      try {
        const stepResult = await executeStep(step, currentInput, executionId)
        finalOutput = stepResult.output
        currentInput = stepResult.output // Pass output as input to next step
      } catch (error) {
        console.error(`Step ${step.step_order} failed:`, error)
        await updateExecutionStatus(executionId, 'failed', finalOutput, `Step ${step.step_name} failed: ${error.message}`)
        return
      }
    }

    // Mark execution as completed
    await updateExecutionStatus(executionId, 'completed', finalOutput)

  } catch (error) {
    console.error('Runbook execution error:', error)
    await updateExecutionStatus(executionId, 'failed', null, error.message)
  }
}

async function executeStep(step: Record<string, unknown>, input: Record<string, unknown>, executionId: string) {
  // Create step execution record
  const { data: stepExecution, error: stepError } = await supabaseAdmin
    .from(getTableName('ai_runbook_step_executions'))
    .insert([{
      runbook_execution_id: executionId,
      runbook_step_id: step.id,
      step_status: 'running',
      step_input: input,
      started_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (stepError) {
    throw new Error(`Failed to create step execution: ${stepError.message}`)
  }

  try {
    let output

    if (step.step_type === 'ai_operation') {
      output = await executeAIOperation(step, input, stepExecution.id)
    } else if (step.step_type === 'endpoint_call') {
      output = await executeEndpointCall(step, input, stepExecution.id)
    } else {
      throw new Error(`Unknown step type: ${step.step_type}`)
    }

    // Update step execution as completed
    await supabaseAdmin
      .from(getTableName('ai_runbook_step_executions'))
      .update({
        step_status: 'completed',
        step_output: output,
        completed_at: new Date().toISOString(),
        execution_time_seconds: 0 // TODO: calculate actual time
      })
      .eq('id', stepExecution.id)

    return { output }
  } catch (error) {
    // Update step execution as failed
    await supabaseAdmin
      .from(getTableName('ai_runbook_step_executions'))
      .update({
        step_status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', stepExecution.id)

    throw error
  }
}

async function executeAIOperation(_step: Record<string, unknown>, _input: Record<string, unknown>, _stepExecutionId: string) {
  // TODO: Implement AI operation execution
  // This should call the existing AI endpoint logic
  throw new Error('AI operation execution not yet implemented')
}

async function executeEndpointCall(step: Record<string, unknown>, input: Record<string, unknown>, _stepExecutionId: string) {
  let method: string
  let url: string
  let headers = {}
  let body = null
  let response_mapping = null

  // Check if using simple configuration (new approach)
  if (step.http_method && step.endpoint_url) {
    method = step.http_method
    url = step.endpoint_url

    // For POST/PUT/PATCH requests, use the input from previous step as JSON body
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && input) {
      body = JSON.stringify(input)
      headers['Content-Type'] = 'application/json'
    }
  }
  // Fall back to advanced configuration (legacy approach)
  else if (step.endpoint_config) {
    const config = step.endpoint_config
    method = config.method
    url = config.url
    headers = config.headers || {}
    response_mapping = config.response_mapping

    // Handle body template for advanced config
    if (config.body_template) {
      body = config.body_template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        // Simple JSON path resolution - in production, use a proper JSON path library
        return getValueByPath(input, path) || match
      })
    }
    // If no body template but it's a POST/PUT/PATCH, use input as JSON body
    else if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && input) {
      body = JSON.stringify(input)
      headers['Content-Type'] = 'application/json'
    }
  } else {
    throw new Error('Endpoint configuration is required for endpoint_call steps. Use http_method + endpoint_url for simple requests, or endpoint_config for advanced configuration.')
  }

  try {
    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers: {
        ...headers
      },
      body: body
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    let responseData

    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json()
    } else {
      responseData = await response.text()
    }

    // Extract output using response mapping (only for advanced config)
    let output = responseData
    if (response_mapping) {
      const { output_path, output_key } = response_mapping
      if (output_path) {
        output = getValueByPath(responseData, output_path.replace('$.', ''))
      }
      if (output_key) {
        return { [output_key]: output }
      }
    }

    return output
  } catch (error) {
    throw new Error(`Endpoint call failed: ${error.message}`)
  }
}

function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

async function updateExecutionStatus(executionId: string, status: string, finalOutput: Record<string, unknown> | null = null, errorMessage: string | null = null) {
  const updateData: Record<string, unknown> = {
    execution_status: status,
    updated_at: new Date().toISOString()
  }

  if (status === 'completed' || status === 'failed') {
    updateData.completed_at = new Date().toISOString()
  }

  if (finalOutput !== null) {
    updateData.final_output = finalOutput
  }

  if (errorMessage) {
    updateData.error_message = errorMessage
  }

  await supabaseAdmin
    .from(getTableName('ai_runbook_executions'))
    .update(updateData)
    .eq('id', executionId)
}