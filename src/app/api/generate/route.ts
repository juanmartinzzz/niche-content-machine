import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient, getTableName } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { executeAIOperation } from '@/lib/ai-utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint_id, prompt_template_id, variables = {}, arbitrary_input } = body

    if (!endpoint_id || !prompt_template_id) {
      return NextResponse.json({
        error: 'endpoint_id and prompt_template_id are required'
      }, { status: 400 })
    }

    // Execute the AI operation using the shared utility
    const result = await executeAIOperation({
      endpoint_id,
      prompt_template_id,
      variables,
      arbitrary_input,
      user_id: user.id
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
