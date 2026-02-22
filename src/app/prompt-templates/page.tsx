import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { PromptTemplatesClient } from './client'

export default async function PromptTemplatesPage() {
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
            Prompt Templates
          </h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Create and manage AI prompt templates for your content generation workflows.
          </p>

          <PromptTemplatesClient />
        </div>
      </main>
    </div>
  )
}