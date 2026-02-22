import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient, getTableName } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

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
    const { name, base_url, is_active, global_timeout_seconds, max_retries, notes } = body

    if (!name || !base_url) {
      return NextResponse.json({ error: 'Name and base_url are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from(getTableName('ai_providers'))
      .update({
        name,
        base_url,
        is_active,
        global_timeout_seconds,
        max_retries,
        notes
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating provider:', error)
      return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 })
    }

    return NextResponse.json({ provider: data })
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

    const { error } = await supabaseAdmin
      .from(getTableName('ai_providers'))
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting provider:', error)
      return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}