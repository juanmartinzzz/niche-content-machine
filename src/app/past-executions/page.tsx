import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { PastExecutionsClient } from './client'

export default async function PastExecutionsPage() {
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
            Past Runbook Executions
          </h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            View and analyze the history of all runbook executions.
          </p>

          <PastExecutionsClient />
        </div>
      </main>
    </div>
  )
}