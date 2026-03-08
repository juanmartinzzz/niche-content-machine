import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { ContentTypesTemplatesClient } from './client'

export default async function ContentTypesTemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="container">
      <main>
        <div style={{ padding: '2rem' }}>
          <ContentTypesTemplatesClient
            showAddButtonInline={true}
            subtitle="Manage content types and their associated templates for your content generation workflows."
          />
        </div>
      </main>
    </div>
  )
}