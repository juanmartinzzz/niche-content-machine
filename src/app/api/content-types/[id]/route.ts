import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient, getTableName } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { validateSlug } from '@/utils/slug'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
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
      .update({
        slug,
        name
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating content type:', error)
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Content type with this slug already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to update content type' }, { status: 500 })
    }

    if (!contentType) {
      return NextResponse.json({ error: 'Content type not found' }, { status: 404 })
    }

    return NextResponse.json(contentType)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const { error } = await supabaseAdmin
      .from(getTableName('content_types'))
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting content type:', error)
      return NextResponse.json({ error: 'Failed to delete content type' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Content type deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}