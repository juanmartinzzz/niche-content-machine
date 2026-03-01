import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient, getTableName } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { is_active, is_default } = body

    const { chatId } = await params

    const updateData: any = {}
    if (is_active !== undefined) updateData.is_active = is_active
    if (is_default !== undefined) updateData.is_default = is_default

    const { data, error } = await supabaseAdmin
      .from(getTableName('user_telegram_chats'))
      .update(updateData)
      .eq('user_id', user.id)
      .eq('chat_id', chatId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
      }
      console.error('Error updating telegram chat:', error)
      return NextResponse.json({ error: 'Failed to update telegram chat' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = await params

    const { error } = await supabaseAdmin
      .from(getTableName('user_telegram_chats'))
      .delete()
      .eq('user_id', user.id)
      .eq('chat_id', chatId)

    if (error) {
      console.error('Error deleting telegram chat:', error)
      return NextResponse.json({ error: 'Failed to delete telegram chat' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}