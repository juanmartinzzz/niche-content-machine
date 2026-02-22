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
      .update({
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
      })
      .eq('id', id)
      .select(`
        *,
        ai_models:${getTableName('ai_models')} (
          *,
          ai_providers:${getTableName('ai_providers')} (*)
        )
      `)
      .single()

    if (error) {
      console.error('Error updating endpoint:', error)
      return NextResponse.json({ error: 'Failed to update endpoint' }, { status: 500 })
    }

    return NextResponse.json({ endpoint: data })
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
      .from(getTableName('ai_endpoints'))
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting endpoint:', error)
      return NextResponse.json({ error: 'Failed to delete endpoint' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}