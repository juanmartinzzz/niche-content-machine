import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient, getTableName } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
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

    // Update execution status to cancelled
    const { error: updateError } = await supabaseAdmin
      .from(getTableName('ai_runbook_executions'))
      .update({
        execution_status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('id', executionId)

    if (updateError) {
      console.error('Error cancelling execution:', updateError)
      return NextResponse.json({ error: 'Failed to cancel execution' }, { status: 500 })
    }

    // Update any running step executions to cancelled
    const { error: stepUpdateError } = await supabaseAdmin
      .from(getTableName('ai_runbook_step_executions'))
      .update({
        step_status: 'skipped',
        completed_at: new Date().toISOString()
      })
      .eq('runbook_execution_id', executionId)
      .eq('step_status', 'running')

    if (stepUpdateError) {
      console.error('Error updating step executions:', stepUpdateError)
      // Don't fail the request if step update fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}