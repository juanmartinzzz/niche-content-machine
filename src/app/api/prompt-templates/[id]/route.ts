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

    console.log('Attempting to delete template with ID:', id)
    console.log('Using table name:', getTableName('ai_prompt_templates'))

    let error, data
    try {
      const result = await supabaseAdmin
        .from(getTableName('ai_prompt_templates'))
        .delete()
        .eq('id', id)
        .select()

      error = result.error
      data = result.data
    } catch (dbError) {
      console.error('Database exception during delete:', dbError)
      return NextResponse.json({
        error: 'Cannot delete prompt template because it is still being used by runbook steps. Please remove all references to this template from runbooks before deleting it.'
      }, { status: 409 })
    }

    console.log('Delete result:', { error, data })

    if (error) {
      console.error('Error deleting prompt template:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Full error object:', JSON.stringify(error, null, 2))

      // Handle foreign key constraint violation
      if (error.code === '23503' && error.message.includes('ncm_ai_runbook_steps_prompt_template_id_fkey')) {
        console.log('Returning user-friendly foreign key error')
        const response = NextResponse.json({
          error: 'Cannot delete prompt template because it is still being used by runbook steps. Please remove all references to this template from runbooks before deleting it.'
        }, { status: 409 })
        console.log('Response created:', response.status, response.body)
        return response
      }

      console.log('Returning generic error')
      return NextResponse.json({ error: `Failed to delete prompt template: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}