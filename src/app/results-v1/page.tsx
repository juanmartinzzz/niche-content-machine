import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { ResultsV1Client } from './client'

export default async function ResultsV1Page() {
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
            Results V1 - AI API Testing
          </h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Test AI API calls by selecting an endpoint and prompt template. View responses directly from the API.
          </p>

          <ResultsV1Client />
        </div>
      </main>
    </div>
  )
}