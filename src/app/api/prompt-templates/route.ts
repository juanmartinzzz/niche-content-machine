import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient, getTableName } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { validateSlug } from '@/utils/slug'
import { logAndReturnError } from '@/lib/api-errors'

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
      slug,
      name,
      system_prompt,
      user_prompt_template,
      description,
      is_active,
      use_structured_output,
      structured_output_schema,
      structured_output_format,
      prompt_intentions
    } = body

    if (!slug || !name || !user_prompt_template) {
      return logAndReturnError('slug, name and user_prompt_template are required', 400, { slug, name, user_prompt_template })
    }

    if (!validateSlug(slug)) {
      return logAndReturnError('slug must contain only lowercase letters, numbers, and dashes', 400, { slug })
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
        slug,
        name,
        system_prompt: system_prompt || null,
        user_prompt_template,
        version: nextVersion,
        is_active: typeof is_active === 'boolean' ? is_active : true, // Default to active for new templates
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

    const normalizedIntentions = Array.isArray(prompt_intentions)
      ? prompt_intentions
          .map((intention, index) => {
            if (
              typeof intention !== 'object' ||
              intention === null ||
              typeof (intention as { section_intention?: unknown }).section_intention !== 'string' ||
              typeof (intention as { section?: unknown }).section !== 'string'
            ) {
              return null
            }

            const sectionIntention = (intention as { section_intention: string }).section_intention.trim()
            const section = (intention as { section: string }).section.trim()

            if (!sectionIntention || !section) {
              return null
            }

            return {
              prompt_template_id: data.id,
              section_intention: sectionIntention,
              section,
              position: typeof (intention as { position?: unknown }).position === 'number'
                ? (intention as { position?: unknown }).position as number
                : index
            }
          })
          .filter((item): item is { prompt_template_id: string; section_intention: string; section: string; position: number } => item !== null)
      : []

    if (normalizedIntentions.length > 0) {
      const { error: intentionError } = await supabaseAdmin
        .from(getTableName('ai_prompt_intentions'))
        .insert(normalizedIntentions)

      if (intentionError) {
        console.error('Error creating prompt intentions:', intentionError)
        return NextResponse.json({ error: 'Failed to create prompt intentions' }, { status: 500 })
      }
    }

    return NextResponse.json({
      template: data,
      prompt_intentions: normalizedIntentions
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}