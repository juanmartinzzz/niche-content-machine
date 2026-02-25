import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient, getTableName } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, stepId } = await params
    const body = await request.json()
    const {
      step_name,
      description,
      prompt_template_id,
      endpoint_id,
      input_from_step_id,
      timeout_seconds,
      retry_count,
      retry_delay_seconds
    } = body

    if (!step_name || !prompt_template_id || !endpoint_id) {
      return NextResponse.json({
        error: 'step_name, prompt_template_id, and endpoint_id are required'
      }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from(getTableName('ai_runbook_steps'))
      .update({
        step_name,
        description: description || null,
        prompt_template_id,
        endpoint_id,
        input_from_step_id: input_from_step_id || null,
        timeout_seconds: timeout_seconds ?? 300,
        retry_count: retry_count ?? 0,
        retry_delay_seconds: retry_delay_seconds ?? 5
      })
      .eq('id', stepId)
      .eq('runbook_id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating runbook step:', error)
      return NextResponse.json({ error: 'Failed to update runbook step' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, stepId } = await params

    const { error } = await supabaseAdmin
      .from(getTableName('ai_runbook_steps'))
      .delete()
      .eq('id', stepId)
      .eq('runbook_id', id)

    if (error) {
      console.error('Error deleting runbook step:', error)
      return NextResponse.json({ error: 'Failed to delete runbook step' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}