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

    const { data: models, error } = await supabaseAdmin
      .from(getTableName('ai_models'))
      .select(`
        *,
        ${getTableName('ai_providers')} (
          id,
          name
        ),
        ${getTableName('ai_endpoints')} (*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching models:', error)
      return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 })
    }

    return NextResponse.json({ models })
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
      provider_id,
      model_identifier,
      display_name,
      context_window_tokens,
      max_output_tokens,
      supports_vision,
      supports_tools,
      input_cost_per_million_tokens,
      output_cost_per_million_tokens,
      is_enabled
    } = body

    if (!provider_id || !model_identifier || !display_name) {
      return NextResponse.json({
        error: 'provider_id, model_identifier, and display_name are required'
      }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from(getTableName('ai_models'))
      .insert([{
        provider_id,
        model_identifier,
        display_name,
        context_window_tokens,
        max_output_tokens,
        supports_vision: supports_vision ?? false,
        supports_tools: supports_tools ?? false,
        input_cost_per_million_tokens,
        output_cost_per_million_tokens,
        is_enabled: is_enabled ?? true
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating model:', error)
      return NextResponse.json({ error: 'Failed to create model' }, { status: 500 })
    }

    return NextResponse.json({ model: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}