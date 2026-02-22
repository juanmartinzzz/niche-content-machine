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

    const { data: endpoints, error } = await supabaseAdmin
      .from(getTableName('ai_endpoints'))
      .select(`
        *,
        ${getTableName('ai_models')} (
          *,
          ${getTableName('ai_providers')} (*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching endpoints:', error)
      return NextResponse.json({ error: 'Failed to fetch endpoints' }, { status: 500 })
    }

    return NextResponse.json({ endpoints })
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
      slug,
      model_id,
      api_path,
      http_method,
      default_temperature,
      default_max_tokens,
      default_top_p,
      supports_streaming,
      is_active,
      description
    } = body

    if (!slug || !model_id || !api_path) {
      return NextResponse.json({
        error: 'slug, model_id, and api_path are required'
      }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from(getTableName('ai_endpoints'))
      .insert([{
        slug,
        model_id,
        api_path,
        http_method: http_method ?? 'POST',
        default_temperature,
        default_max_tokens,
        default_top_p,
        supports_streaming: supports_streaming ?? false,
        is_active: is_active ?? true,
        description
      }])
      .select(`
        *,
        ${getTableName('ai_models')} (
          *,
          ${getTableName('ai_providers')} (*)
        )
      `)
      .single()

    if (error) {
      console.error('Error creating endpoint:', error)
      return NextResponse.json({ error: 'Failed to create endpoint' }, { status: 500 })
    }

    return NextResponse.json({ endpoint: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}