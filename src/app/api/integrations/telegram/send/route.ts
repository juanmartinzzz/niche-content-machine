import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient, getTableName } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Check for internal runbook execution header
    const internalUserId = request.headers.get('x-internal-user-id')

    let user
    if (internalUserId) {
      // Internal call from runbook execution - validate user exists
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(internalUserId)
      if (userError || !userData.user) {
        return NextResponse.json({ error: 'Invalid internal user' }, { status: 401 })
      }
      user = userData.user
    } else {
      // Normal authenticated request
      const supabase = await createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      user = authUser
    }

    const body = await request.json()
    const { chat_id, message, parse_mode } = body

    if (!chat_id || !message) {
      return NextResponse.json({
        error: 'chat_id and message are required'
      }, { status: 400 })
    }

    // Validate that the chat_id belongs to the authenticated user
    const { data: userChat, error: chatError } = await supabaseAdmin
      .from(getTableName('user_telegram_chats'))
      .select('id, is_active')
      .eq('user_id', user.id)
      .eq('chat_id', chat_id)
      .single()

    if (chatError || !userChat) {
      return NextResponse.json({ error: 'Chat not found or not accessible' }, { status: 404 })
    }

    if (!userChat.is_active) {
      return NextResponse.json({ error: 'Chat is disabled' }, { status: 400 })
    }

    // Fetch bot configuration
    const { data: telegramBot, error: botError } = await supabaseAdmin
      .from(getTableName('integrations'))
      .select('config')
      .eq('type', 'telegram_bot')
      .eq('is_active', true)
      .single()

    if (botError || !telegramBot) {
      return NextResponse.json({ error: 'Telegram bot not configured' }, { status: 503 })
    }

    const { bot_token, api_url } = telegramBot.config
    if (!bot_token) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 503 })
    }

    const telegramApiUrl = api_url || 'https://api.telegram.org'

    // Send message via Telegram Bot API
    const telegramResponse = await fetch(`${telegramApiUrl}/bot${bot_token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id,
        text: message,
        parse_mode: parse_mode || 'HTML', // Default to HTML for better formatting
        disable_web_page_preview: false
      })
    })

    const telegramResult = await telegramResponse.json()

    if (!telegramResponse.ok) {
      console.error('Telegram API error:', telegramResult)

      // Handle specific Telegram API errors
      if (telegramResult.error_code === 429) {
        return NextResponse.json({
          error: 'Rate limit exceeded. Please try again later.',
          telegram_error: telegramResult
        }, { status: 429 })
      }

      return NextResponse.json({
        error: 'Failed to send message via Telegram',
        telegram_error: telegramResult
      }, { status: telegramResponse.status })
    }

    return NextResponse.json({
      success: true,
      message_id: telegramResult.result?.message_id,
      telegram_response: telegramResult
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}