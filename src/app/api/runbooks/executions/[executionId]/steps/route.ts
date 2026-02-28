import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ executionId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { executionId } = await params

    const { data: stepExecutions, error } = await supabase
      .from('ncm_ai_runbook_step_executions')
      .select(`
        *,
        ncm_ai_runbook_steps!inner (
          step_name,
          step_order,
          step_type
        )
      `)
      .eq('runbook_execution_id', executionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching step executions:', error)
      return NextResponse.json({ error: 'Failed to fetch step executions' }, { status: 500 })
    }

    // Transform the data to flatten the step information
    const transformedSteps = stepExecutions.map(step => ({
      ...step,
      step_name: step.ncm_ai_runbook_steps.step_name,
      step_order: step.ncm_ai_runbook_steps.step_order,
      step_type: step.ncm_ai_runbook_steps.step_type
    }))

    return NextResponse.json(transformedSteps)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}