import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient, getTableName } from '@/lib/supabase-server'
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

    const { data: execution, error } = await supabaseAdmin
      .from(getTableName('ai_runbook_executions'))
      .select('*')
      .eq('id', executionId)
      .single()

    if (error) {
      console.error('Error fetching execution:', error)
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 })
    }

    return NextResponse.json(execution)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}