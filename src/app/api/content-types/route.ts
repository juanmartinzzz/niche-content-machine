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

    const { data: contentTypes, error } = await supabaseAdmin
      .from(getTableName('content_types'))
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching content types:', error)
      return NextResponse.json({ error: 'Failed to fetch content types' }, { status: 500 })
    }

    return NextResponse.json(contentTypes)
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
    const { slug, name } = body

    // Validate required fields
    if (!slug || !name) {
      return NextResponse.json({ error: 'Slug and name are required' }, { status: 400 })
    }

    // Validate slug format
    if (!validateSlug(slug)) {
      return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 })
    }

    const { data: contentType, error } = await supabaseAdmin
      .from(getTableName('content_types'))
      .insert({
        slug,
        name
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating content type:', error)
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Content type with this slug already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create content type' }, { status: 500 })
    }

    return NextResponse.json(contentType, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}