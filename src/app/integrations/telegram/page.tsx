import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { TelegramClient } from './client'

export default async function TelegramPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="container">
      <main>
        <div style={{ padding: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Telegram Bot Integration
          </h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Manage your Telegram chat connections to receive notifications from the bot.
          </p>

          <TelegramClient />
        </div>
      </main>
    </div>
  )
}