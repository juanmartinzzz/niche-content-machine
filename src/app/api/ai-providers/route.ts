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

    const { data: providers, error } = await supabaseAdmin
      .from(getTableName('ai_providers'))
      .select(`
        *,
        ai_models:${getTableName('ai_models')} (
          *,
          ai_endpoints:${getTableName('ai_endpoints')} (*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching providers:', error)
      return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 })
    }

    return NextResponse.json({ providers })
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
    const { name, base_url, is_active, global_timeout_seconds, max_retries, notes } = body

    if (!name || !base_url) {
      return NextResponse.json({ error: 'Name and base_url are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from(getTableName('ai_providers'))
      .insert([{
        name,
        base_url,
        is_active: is_active ?? true,
        global_timeout_seconds: global_timeout_seconds ?? 30,
        max_retries: max_retries ?? 3,
        notes
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating provider:', error)
      return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 })
    }

    return NextResponse.json({ provider: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}