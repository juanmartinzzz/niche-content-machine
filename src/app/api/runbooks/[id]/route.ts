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

    const { data: runbook, error } = await supabaseAdmin
      .from(getTableName('ai_runbooks'))
      .select(`
        *,
        steps:ncm_ai_runbook_steps(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching runbook:', error)
      return NextResponse.json({ error: 'Failed to fetch runbook' }, { status: 500 })
    }

    if (!runbook) {
      return NextResponse.json({ error: 'Runbook not found' }, { status: 404 })
    }

    return NextResponse.json(runbook)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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
    const {
      name,
      description,
      is_active,
      max_execution_time_minutes,
      on_error_behavior
    } = body

    if (!name) {
      return NextResponse.json({
        error: 'name is required'
      }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from(getTableName('ai_runbooks'))
      .update({
        name,
        description: description || null,
        is_active: is_active ?? true,
        max_execution_time_minutes: max_execution_time_minutes ?? 30,
        on_error_behavior: on_error_behavior ?? 'stop'
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating runbook:', error)
      return NextResponse.json({ error: 'Failed to update runbook' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    // Delete the runbook (cascade will handle steps and executions)
    const { error } = await supabaseAdmin
      .from(getTableName('ai_runbooks'))
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting runbook:', error)
      return NextResponse.json({ error: 'Failed to delete runbook' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}