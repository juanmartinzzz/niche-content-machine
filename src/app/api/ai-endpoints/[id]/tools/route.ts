import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient, getTableName } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Fetch endpoint with model and supported tools
    const { data: endpoint, error } = await supabaseAdmin
      .from(getTableName('ai_endpoints'))
      .select(`
        id,
        ai_models:${getTableName('ai_models')} (
          id,
          display_name,
          model_identifier,
          supported_tools,
          supports_tools
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !endpoint) {
      console.error('Error fetching endpoint:', error)
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
    }

    const endpointData = endpoint as any
    const model = endpointData.ai_models
    if (!model) {
      return NextResponse.json({ error: 'Endpoint model configuration not found' }, { status: 404 })
    }

    // Return supported tools
    const supportedTools = model.supported_tools || []
    const supportsTools = model.supports_tools || false

    return NextResponse.json({
      supports_tools: supportsTools,
      supported_tools: supportedTools
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}