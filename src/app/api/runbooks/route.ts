import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient, getTableName } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch runbooks
    const { data: runbooks, error } = await supabaseAdmin
      .from(getTableName('ai_runbooks'))
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching runbooks:', error)
      return NextResponse.json({ error: 'Failed to fetch runbooks' }, { status: 500 })
    }

    // Get step counts for each runbook
    const runbooksWithSteps = await Promise.all(
      (runbooks || []).map(async (runbook) => {
        const { count } = await supabaseAdmin
          .from(getTableName('ai_runbook_steps'))
          .select('*', { count: 'exact', head: true })
          .eq('runbook_id', runbook.id)

        return {
          ...runbook,
          steps: count || 0
        }
      })
    )

    return NextResponse.json(runbooksWithSteps)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      .insert([{
        name,
        description: description || null,
        is_active: is_active ?? true,
        max_execution_time_minutes: max_execution_time_minutes ?? 30,
        on_error_behavior: on_error_behavior ?? 'stop'
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating runbook:', error)
      return NextResponse.json({ error: 'Failed to create runbook' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}