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

    // Fetch user's telegram chats
    const { data: chats, error } = await supabaseAdmin
      .from(getTableName('user_telegram_chats'))
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching telegram chats:', error)
      return NextResponse.json({ error: 'Failed to fetch telegram chats' }, { status: 500 })
    }

    return NextResponse.json(chats || [])
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
    const { chat_id, chat_title } = body

    if (!chat_id) {
      return NextResponse.json({
        error: 'chat_id is required'
      }, { status: 400 })
    }

    // Check if chat already exists for this user
    const { data: existingChat } = await supabaseAdmin
      .from(getTableName('user_telegram_chats'))
      .select('id')
      .eq('user_id', user.id)
      .eq('chat_id', chat_id)
      .single()

    if (existingChat) {
      return NextResponse.json({
        error: 'Chat already connected'
      }, { status: 409 })
    }

    const { data, error } = await supabaseAdmin
      .from(getTableName('user_telegram_chats'))
      .insert([{
        user_id: user.id,
        chat_id,
        chat_title: chat_title || null,
        is_active: true
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating telegram chat:', error)
      return NextResponse.json({ error: 'Failed to create telegram chat' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}