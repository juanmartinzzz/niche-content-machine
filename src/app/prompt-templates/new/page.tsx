import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { PromptTemplateEditor } from '@/app/prompt-templates/editor/client'

export default async function NewPromptTemplatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="container">
      <main>
        <div style={{ padding: '2rem' }}>
          <PromptTemplateEditor mode="create" />
        </div>
      </main>
    </div>
  )
}
