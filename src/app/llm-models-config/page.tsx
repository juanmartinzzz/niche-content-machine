import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

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
            Configure and manage your language model settings and preferences.
          </p>

          {/* Placeholder content - this would be expanded with actual model management features */}
          <div style={{
            padding: '2rem',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Model Settings
            </h2>
            <p style={{ color: '#888' }}>
              Model configuration options will appear here.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}