import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { FindTrendClient } from './client'

export default async function FindTrendPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="container">
      <main>
        <div style={{ padding: '2rem' }}>
          <FindTrendClient />
        </div>
      </main>
    </div>
  )
}
