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
      .from(getTableName('templates'))
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
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
      content_type_id,
      slug,
      name,
      visual_style,
      description,
      html_template,
      width_pixels,
      height_pixels
    } = body

    const parsedWidthPixels = width_pixels === null || width_pixels === undefined || width_pixels === ''
      ? null
      : Number(width_pixels)

    const parsedHeightPixels = height_pixels === null || height_pixels === undefined || height_pixels === ''
      ? null
      : Number(height_pixels)

    // Validate required fields
    if (!content_type_id || !slug || !name || !visual_style) {
      return NextResponse.json({ error: 'Content type ID, slug, name, and visual style are required' }, { status: 400 })
    }

    // Validate visual style
    const validVisualStyles = ['minimal', 'bold', 'modern', 'classic', 'clean']
    if (!validVisualStyles.includes(visual_style)) {
      return NextResponse.json({ error: 'Invalid visual style' }, { status: 400 })
    }

    const { data: template, error } = await supabaseAdmin
      .from(getTableName('templates'))
      .insert({
        content_type_id,
        slug,
        name,
        visual_style,
        description: description || null,
        html_template: html_template || null,
        width_pixels: Number.isFinite(parsedWidthPixels) ? parsedWidthPixels : null,
        height_pixels: Number.isFinite(parsedHeightPixels) ? parsedHeightPixels : null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}