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

    const { data: templates, error } = await supabaseAdmin
      .from(getTableName('ai_prompt_templates'))
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching prompt templates:', error)
      return NextResponse.json({ error: 'Failed to fetch prompt templates' }, { status: 500 })
    }

    return NextResponse.json(templates)
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
      system_prompt,
      user_prompt_template,
      description,
      use_structured_output,
      structured_output_schema,
      structured_output_format
    } = body

    if (!name || !user_prompt_template) {
      return NextResponse.json({
        error: 'name and user_prompt_template are required'
      }, { status: 400 })
    }

    // Get the next version number for this template name
    const { data: existingTemplates } = await supabaseAdmin
      .from(getTableName('ai_prompt_templates'))
      .select('version')
      .eq('name', name)
      .order('version', { ascending: false })
      .limit(1)

    const nextVersion = existingTemplates && existingTemplates.length > 0
      ? existingTemplates[0].version + 1
      : 1

    const { data, error } = await supabaseAdmin
      .from(getTableName('ai_prompt_templates'))
      .insert([{
        name,
        system_prompt: system_prompt || null,
        user_prompt_template,
        version: nextVersion,
        is_active: nextVersion === 1, // First version is active by default
        description: description || null,
        use_structured_output: use_structured_output || false,
        structured_output_schema: structured_output_schema || null,
        structured_output_format: structured_output_format || null
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating prompt template:', error)
      return NextResponse.json({ error: 'Failed to create prompt template' }, { status: 500 })
    }

    return NextResponse.json({ template: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}