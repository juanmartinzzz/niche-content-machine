import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { RunbookExecutionClient } from './client'

export default async function RunbookExecutionPage() {
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
            Runbook Execution
          </h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Execute runbooks and monitor their progress step by step.
          </p>

          <RunbookExecutionClient />
        </div>
      </main>
    </div>
  )
}