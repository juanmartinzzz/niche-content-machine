import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { LLMModelsConfigClient } from './client'

export default async function LLMModelsConfigPage() {
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
            LLM Models Configuration
          </h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Configure and manage your AI providers, models, and endpoints.
          </p>

          <LLMModelsConfigClient />
        </div>
      </main>
    </div>
  )
}