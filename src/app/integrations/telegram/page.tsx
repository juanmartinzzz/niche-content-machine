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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                Telegram Bot Integration
              </h1>
              <p style={{ color: '#666', margin: '0.5rem 0 0 0' }}>
                Manage your Telegram chat connections to receive notifications from the bot.
              </p>
            </div>
            <TelegramClient showHeaderButton={true} />
          </div>

          <TelegramClient showHeaderButton={false} />
        </div>
      </main>
    </div>
  )
}