import { notFound, redirect } from 'next/navigation'
import { createClient, getTableName } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  PromptTemplateEditor,
  type PromptTemplatePayload,
  type PromptIntentionPayload
} from '@/app/prompt-templates/editor/client'

interface PromptTemplateWithIntentions {
  id: string
  slug: string
  name: string
  system_prompt: string | null
  user_prompt_template: string
  description: string | null
  is_active: boolean
  use_structured_output: boolean
  structured_output_schema: Record<string, unknown> | string | null
  structured_output_format: 'pydantic' | 'zod' | 'json_schema' | null
  prompt_intentions: PromptIntentionPayload[]
}

export default async function EditPromptTemplatePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: template, error } = await supabaseAdmin
    .from(getTableName('ai_prompt_templates'))
    .select('*, prompt_intentions:ncm_ai_prompt_intentions(*)')
    .eq('id', resolvedParams.id)
    .single()

  if (error || !template) {
    notFound()
  }

  const templateRecord = template as unknown as PromptTemplateWithIntentions

  const initialTemplate: PromptTemplatePayload = {
    id: templateRecord.id,
    slug: templateRecord.slug,
    name: templateRecord.name,
    system_prompt: templateRecord.system_prompt,
    user_prompt_template: templateRecord.user_prompt_template,
    description: templateRecord.description,
    is_active: templateRecord.is_active,
    use_structured_output: templateRecord.use_structured_output,
    structured_output_schema: templateRecord.structured_output_schema,
    structured_output_format: templateRecord.structured_output_format
  }

  const templateIntentions: PromptIntentionPayload[] = Array.isArray(templateRecord.prompt_intentions)
    ? templateRecord.prompt_intentions.map((item) => ({
      id: item.id,
      section_intention: item.section_intention,
      section: item.section,
      position: item.position
    }))
    : []

  const fallbackIntentions: PromptIntentionPayload[] = templateIntentions.length === 0 && templateRecord.user_prompt_template
    ? templateRecord.user_prompt_template
      .split('\n\n')
      .filter((section) => section.trim().length > 0)
      .map((section, index) => ({
        id: `legacy-${index}`,
        section_intention: `Section ${index + 1}`,
        section: section.trim(),
        position: index
      }))
    : []

  const initialIntentions = templateIntentions.length > 0
    ? templateIntentions
    : fallbackIntentions

  return (
    <div className="container">
      <main>
        <div style={{ padding: '2rem' }}>
          <PromptTemplateEditor
            mode="edit"
            initialTemplate={initialTemplate}
            initialIntentions={initialIntentions}
          />
        </div>
      </main>
    </div>
  )
}
