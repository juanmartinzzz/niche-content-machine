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
      .update({
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
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating model:', error)
      return NextResponse.json({ error: 'Failed to update model' }, { status: 500 })
    }

    return NextResponse.json({ model: data })
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
      .from(getTableName('ai_models'))
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting model:', error)
      return NextResponse.json({ error: 'Failed to delete model' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}