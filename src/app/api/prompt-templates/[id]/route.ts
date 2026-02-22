import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient, getTableName } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
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

    const { data: template, error } = await supabaseAdmin
      .from(getTableName('ai_prompt_templates'))
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching prompt template:', error)
      return NextResponse.json({ error: 'Failed to fetch prompt template' }, { status: 500 })
    }

    if (!template) {
      return NextResponse.json({ error: 'Prompt template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
      name,
      system_prompt,
      user_prompt_template,
      description,
      is_active,
      use_structured_output,
      structured_output_schema,
      structured_output_format
    } = body

    if (!name || !user_prompt_template) {
      return NextResponse.json({
        error: 'name and user_prompt_template are required'
      }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from(getTableName('ai_prompt_templates'))
      .update({
        name,
        system_prompt: system_prompt || null,
        user_prompt_template,
        description: description || null,
        is_active: is_active ?? false,
        use_structured_output: use_structured_output ?? false,
        structured_output_schema: structured_output_schema || null,
        structured_output_format: structured_output_format || null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating prompt template:', error)
      return NextResponse.json({ error: 'Failed to update prompt template' }, { status: 500 })
    }

    return NextResponse.json({ template: data })
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
      .from(getTableName('ai_prompt_templates'))
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting prompt template:', error)
      return NextResponse.json({ error: 'Failed to delete prompt template' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}