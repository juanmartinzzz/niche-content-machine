'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Textarea, PillList, useToast, JsonTreeViewer, Switch } from '@/components/interaction'
import { Plus, ChevronDown, ChevronUp, Trash2, Save, ArrowLeft } from 'lucide-react'
import { generateSlug, validateSlug } from '@/utils/slug'
import { formatMarkdownText } from '@/utils/format-markdown-text'
import styles from './client.module.css'

export interface PromptIntentionPayload {
  id?: string
  section_intention: string
  section: string
  position?: number
}

export interface PromptTemplatePayload {
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
}

interface PromptTemplateEditorProps {
  mode: 'create' | 'edit'
  initialTemplate?: PromptTemplatePayload | null
  initialIntentions?: PromptIntentionPayload[]
}

interface PromptTemplateFormState {
  slug: string
  name: string
  system_prompt: string
  description: string
  is_active: boolean
  use_structured_output: boolean
  structured_output_schema: string
  structured_output_format: 'pydantic' | 'zod' | 'json_schema'
}

interface PromptIntentionFormState {
  id: string
  section_intention: string
  section: string
  position: number
}

const stringifySchema = (value: Record<string, unknown> | string | null): string => {
  if (!value) {
    return ''
  }

  return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
}

const GENERATE_TEXT_DEBOUNCE_MS = 4300
const INTERNAL_GENERATE_TEXT_ENDPOINT = '/api/internal/ai/generate-text'
const SECTION_PROMPT_ASSISTANCE_INSTRUCTIONS = `
You are helping a user build high-quality prompt sections for a larger prompt. 
Given a single "Part goal", write one strong, practical, and tightly focused section that directly achieves that goal. 
Return only the section text and nothing else. Do not include role, persona, or preface language 
(for example: "you are a/an ...", "act as ...", "you are an ...").
`

const normalizeIntentions = (intentions: PromptIntentionPayload[] = []): PromptIntentionFormState[] => {
  const sanitized = intentions.map((item) => ({
    sectionIntention: typeof item.section_intention === 'string' ? item.section_intention.trim() : '',
    section: typeof item.section === 'string' ? item.section.trim() : ''
  }))

  const normalized = intentions
    .filter((_, index) => sanitized[index].sectionIntention || sanitized[index].section)
    .map((item, index) => ({
      id: item.id || `${index}-${Date.now()}`,
      section_intention: sanitized[index].sectionIntention,
      section: sanitized[index].section,
      position: typeof item.position === 'number' ? item.position : index
    }))

  if (normalized.length === 0) {
    return [{ id: `empty-${Date.now()}`, section_intention: '', section: '', position: 0 }]
  }

  return normalized.sort((a, b) => a.position - b.position)
}

const parseMarkdownInline = (text: string): React.ReactNode[] => {
  const pattern = /\*\*([^*]+)\*\*|\*([^*\n]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g
  const nodes: React.ReactNode[] = []
  let cursor = 0
  let match: RegExpExecArray | null
  let tokenIndex = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index))
    }

    if (match[1] !== undefined) {
      nodes.push(
        <strong key={`inline-bold-${match.index}-${tokenIndex}`} className={styles.markdownStrong}>
          {match[1]}
        </strong>
      )
    } else if (match[2] !== undefined) {
      nodes.push(
        <em key={`inline-italic-${match.index}-${tokenIndex}`} className={styles.markdownItalic}>
          {match[2]}
        </em>
      )
    } else if (match[3] !== undefined) {
      nodes.push(
        <code key={`inline-code-${match.index}-${tokenIndex}`} className={styles.markdownInlineCode}>
          {match[3]}
        </code>
      )
    } else if (match[4] !== undefined && match[5] !== undefined) {
      nodes.push(
        <a
          key={`inline-link-${match.index}-${tokenIndex}`}
          href={match[5]}
          target="_blank"
          rel="noreferrer"
          className={styles.markdownLink}
        >
          {match[4]}
        </a>
      )
    }

    cursor = match.index + match[0].length
    tokenIndex += 1
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor))
  }

  return nodes
}

const parseMarkdownBlock = (text: string): React.ReactNode[] => {
  const normalizedText = text
    .replace(/\r\n?/g, '\n')
    .trim()

  if (!normalizedText) {
    return [
      <p key="empty-markdown" className={styles.markdownEmpty}>
        No section content yet. Click “Edit manually” to add text.
      </p>
    ]
  }

  const lines = normalizedText.split('\n')
  const output: React.ReactNode[] = []
  const paragraphLines: string[] = []
  const orderedListItems: string[] = []
  const unorderedListItems: string[] = []
  let itemCounter = 0

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return
    }

    const paragraph = paragraphLines.join(' ').trim()
    if (paragraph) {
      output.push(
        <p key={`p-${itemCounter++}`} className={styles.markdownParagraph}>
          {parseMarkdownInline(paragraph)}
        </p>
      )
    }

    paragraphLines.length = 0
  }

  const flushUnorderedList = () => {
    if (unorderedListItems.length === 0) {
      return
    }

    output.push(
      <ul key={`ul-${itemCounter++}`} className={styles.markdownList}>
        {unorderedListItems.map((li, index) => (
          <li key={`${li.slice(0, 20)}-${index}`} className={styles.markdownListItem}>
            {parseMarkdownInline(li)}
          </li>
        ))}
      </ul>
    )
    unorderedListItems.length = 0
  }

  const flushOrderedList = () => {
    if (orderedListItems.length === 0) {
      return
    }

    output.push(
      <ol key={`ol-${itemCounter++}`} className={styles.markdownList}>
        {orderedListItems.map((li, index) => (
          <li key={`${li.slice(0, 20)}-${index}`} className={styles.markdownListItem}>
            {parseMarkdownInline(li)}
          </li>
        ))}
      </ol>
    )
    orderedListItems.length = 0
  }

  let i = 0
  while (i < lines.length) {
    const rawLine = lines[i]
    const line = rawLine.trim()

    if (!line) {
      flushParagraph()
      flushUnorderedList()
      flushOrderedList()
      i += 1
      continue
    }

    if (line === '```') {
      const codeLines: string[] = []

      flushParagraph()
      flushUnorderedList()
      flushOrderedList()

      i += 1
      while (i < lines.length && lines[i].trim() !== '```') {
        codeLines.push(lines[i])
        i += 1
      }

      output.push(
        <pre key={`code-${itemCounter++}`} className={styles.markdownCodeBlock}>
          <code className={styles.markdownCode}>{codeLines.join('\n')}</code>
        </pre>
      )

      if (i < lines.length && lines[i].trim() === '```') {
        i += 1
      }

      continue
    }

    const headingMatch = rawLine.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const headingText = headingMatch[2].trim()

      flushParagraph()
      flushUnorderedList()
      flushOrderedList()

      const headingNode = parseMarkdownInline(headingText)
      const HeadingTag = `h${Math.min(6, Math.max(2, level))}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      const HeadingElement = <HeadingTag key={`h-${itemCounter++}`} className={styles.markdownHeading}>{headingNode}</HeadingTag>

      output.push(HeadingElement)
      i += 1
      continue
    }

    const unorderedMatch = rawLine.match(/^\s*[-*+]\s+(.*)$/)
    if (unorderedMatch) {
      flushParagraph()
      flushOrderedList()
      unorderedListItems.push(unorderedMatch[1].trim())
      i += 1
      continue
    }

    const orderedMatch = rawLine.match(/^\s*\d+\.\s+(.*)$/)
    if (orderedMatch) {
      flushParagraph()
      flushUnorderedList()
      orderedListItems.push(orderedMatch[1].trim())
      i += 1
      continue
    }

    const blockQuoteMatch = rawLine.match(/^\s*>\s?(.*)$/)
    if (blockQuoteMatch) {
      flushParagraph()
      flushUnorderedList()
      flushOrderedList()

      output.push(
        <blockquote key={`quote-${itemCounter++}`} className={styles.markdownBlockquote}>
          {parseMarkdownInline(blockQuoteMatch[1] || '')}
        </blockquote>
      )
      i += 1
      continue
    }

    if (unorderedListItems.length > 0 || orderedListItems.length > 0) {
      flushUnorderedList()
      flushOrderedList()
    }

    paragraphLines.push(line)
    i += 1
  }

  flushParagraph()
  flushUnorderedList()
  flushOrderedList()

  return output
}

export const PromptTemplateEditor: React.FC<PromptTemplateEditorProps> = ({
  mode,
  initialTemplate,
  initialIntentions
}) => {
  const router = useRouter()
  const { showToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [slugError, setSlugError] = useState('')
  const [isSectionGenerating, setIsSectionGenerating] = useState<Record<string, boolean>>({})
  const [sectionLocked, setSectionLocked] = useState<Record<string, boolean>>({})
  const [sectionEditMode, setSectionEditMode] = useState<Record<string, boolean>>({})
  const [sectionGenerationError, setSectionGenerationError] = useState<Record<string, string>>({})
  const sectionGenerationDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const sectionGenerationAttemptRef = useRef<Record<string, number>>({})

  const [templateForm, setTemplateForm] = useState<PromptTemplateFormState>({
    slug: initialTemplate?.slug || '',
    name: initialTemplate?.name || '',
    system_prompt: initialTemplate?.system_prompt || '',
    description: initialTemplate?.description || '',
    is_active: initialTemplate?.is_active ?? true,
    use_structured_output: initialTemplate?.use_structured_output || false,
    structured_output_schema: stringifySchema(initialTemplate?.structured_output_schema || null),
    structured_output_format: initialTemplate?.structured_output_format || 'pydantic'
  })

  const [intentions, setIntentions] = useState<PromptIntentionFormState[]>(
    normalizeIntentions(initialIntentions)
  )

  useEffect(() => {
    setTemplateForm({
      slug: initialTemplate?.slug || '',
      name: initialTemplate?.name || '',
      system_prompt: initialTemplate?.system_prompt || '',
      description: initialTemplate?.description || '',
      is_active: initialTemplate?.is_active ?? true,
      use_structured_output: initialTemplate?.use_structured_output || false,
      structured_output_schema: stringifySchema(initialTemplate?.structured_output_schema || null),
      structured_output_format: initialTemplate?.structured_output_format || 'pydantic'
    })
  }, [initialTemplate])

  useEffect(() => {
    setIntentions(normalizeIntentions(initialIntentions))
    setIsSectionGenerating({})
    setSectionLocked({})
    setSectionEditMode({})
    setSectionGenerationError({})
    Object.values(sectionGenerationDebounceRef.current).forEach((timerId) => clearTimeout(timerId))
    sectionGenerationDebounceRef.current = {}
    sectionGenerationAttemptRef.current = {}
  }, [initialIntentions])

  // Auto-generate slug from name when creating a new template.
  useEffect(() => {
    if (mode === 'create' && templateForm.name && !templateForm.slug) {
      const suggestedSlug = generateSlug(templateForm.name)
      if (suggestedSlug) {
        setTemplateForm(prev => ({ ...prev, slug: suggestedSlug }))
      }
    }
  }, [mode, templateForm.name, templateForm.slug])

  // Validate slug format.
  useEffect(() => {
    if (templateForm.slug && !validateSlug(templateForm.slug)) {
      setSlugError('Slug must contain only lowercase letters, numbers, and dashes')
    } else {
      setSlugError('')
    }
  }, [templateForm.slug])

  const mergedPromptTemplate = useMemo(() => {
    return intentions
      .slice()
      .sort((a, b) => a.position - b.position)
      .filter(item => item.section.trim().length > 0)
      .map(item => item.section.trim())
      .join('\n\n')
  }, [intentions])

  const moveIntention = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction

    if (targetIndex < 0 || targetIndex >= intentions.length) {
      return
    }

    setIntentions(prev => {
      const copy = [...prev]
      const moved = copy[index]
      copy[index] = copy[targetIndex]
      copy[targetIndex] = moved

      return copy.map((item, intentIndex) => ({
        ...item,
        position: intentIndex
      }))
    })
  }

  const updateIntention = (
    index: number,
    key: keyof Pick<PromptIntentionFormState, 'section_intention' | 'section'>,
    value: string
  ) => {
    const targetIntention = intentions[index]

    setIntentions(prev => {
      const copy = [...prev]
      copy[index] = {
        ...copy[index],
        [key]: value
      }
      return copy
    })

    if (key === 'section_intention' && targetIntention) {
      const intentionId = targetIntention.id
      const trimmedGoal = value.trim()

      if (sectionGenerationDebounceRef.current[intentionId]) {
        clearTimeout(sectionGenerationDebounceRef.current[intentionId])
        delete sectionGenerationDebounceRef.current[intentionId]
      }

      setSectionGenerationError(prev => {
        const nextState = { ...prev }
        delete nextState[intentionId]
        return nextState
      })

      if (!trimmedGoal) {
        setIsSectionGenerating(prev => ({
          ...prev,
          [intentionId]: false
        }))
        setSectionLocked(prev => ({
          ...prev,
          [intentionId]: false
        }))
        return
      }

      sectionGenerationDebounceRef.current[intentionId] = setTimeout(() => {
        const currentAttempt = (sectionGenerationAttemptRef.current[intentionId] || 0) + 1
        sectionGenerationAttemptRef.current[intentionId] = currentAttempt

        setIsSectionGenerating(prev => ({
          ...prev,
          [intentionId]: true
        }))
        setSectionLocked(prev => ({
          ...prev,
          [intentionId]: true
        }))

        const runGeneration = async () => {
          try {
            const response = await fetch(INTERNAL_GENERATE_TEXT_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemPrompt: SECTION_PROMPT_ASSISTANCE_INSTRUCTIONS,
                prompt: trimmedGoal
              })
            })

            const data = await response.json()
            if (!response.ok) {
              throw new Error(data?.error || `Request failed with status ${response.status}`)
            }

            const generatedSection = formatMarkdownText(typeof data.text === 'string' ? data.text : '')
            if (!generatedSection) {
              throw new Error('Model returned an empty section.')
            }

            setIntentions(prev => {
              const copy = [...prev]
              const intentionIndex = copy.findIndex(item => item.id === intentionId)

              if (intentionIndex === -1) {
                return prev
              }

              if (sectionGenerationAttemptRef.current[intentionId] !== currentAttempt) {
                return prev
              }

              copy[intentionIndex] = {
                ...copy[intentionIndex],
                section: generatedSection
              }
              return copy
            })
          } catch (error) {
            if (sectionGenerationAttemptRef.current[intentionId] === currentAttempt) {
              const errorMessage = error instanceof Error ? error.message : 'Unable to generate section content.'
              setSectionGenerationError(prev => ({
                ...prev,
                [intentionId]: errorMessage
              }))
              showToast(`Section generation failed for Intention: ${errorMessage}`, 'error')
            }
          } finally {
            if (sectionGenerationAttemptRef.current[intentionId] === currentAttempt) {
              setIsSectionGenerating(prev => ({
                ...prev,
                [intentionId]: false
              }))
              setSectionLocked(prev => ({
                ...prev,
                [intentionId]: false
              }))
            }
            delete sectionGenerationDebounceRef.current[intentionId]
          }
        }

        void runGeneration()
      }, GENERATE_TEXT_DEBOUNCE_MS)
    }
  }

  const toggleSectionEditMode = (intentionId: string) => {
    setSectionEditMode(prev => ({
      ...prev,
      [intentionId]: !prev[intentionId]
    }))
  }

  const removeIntention = (index: number) => {
    setIntentions(prev => {
      const copy = [...prev]
      const removed = copy[index]
      copy.splice(index, 1)

      if (removed?.id) {
        delete sectionGenerationAttemptRef.current[removed.id]
        if (sectionGenerationDebounceRef.current[removed.id]) {
          clearTimeout(sectionGenerationDebounceRef.current[removed.id])
          delete sectionGenerationDebounceRef.current[removed.id]
        }
        setSectionEditMode(prev => {
          const nextState = { ...prev }
          delete nextState[removed.id]
          return nextState
        })
        setIsSectionGenerating(prev => {
          const nextState = { ...prev }
          delete nextState[removed.id]
          return nextState
        })
        setSectionLocked(prev => {
          const nextState = { ...prev }
          delete nextState[removed.id]
          return nextState
        })
        setSectionGenerationError(prev => {
          const nextState = { ...prev }
          delete nextState[removed.id]
          return nextState
        })
      }

      if (copy.length === 0) {
        return [{ id: `empty-${Date.now()}`, section_intention: '', section: '', position: 0 }]
      }

      return copy.map((item, itemIndex) => ({ ...item, position: itemIndex }))
    })
  }

  useEffect(() => {
    return () => {
      Object.values(sectionGenerationDebounceRef.current).forEach((timerId) => clearTimeout(timerId))
      sectionGenerationDebounceRef.current = {}
    }
  }, [])

  const addIntention = () => {
    setIntentions(prev => ([
      ...prev,
      {
        id: `intent-${Date.now()}`,
        section_intention: '',
        section: '',
        position: prev.length
      }
    ]))
  }

  const getSchemaOptions = () => [
    { id: 'pydantic', label: 'Pydantic' },
    { id: 'zod', label: 'Zod' },
    { id: 'json_schema', label: 'JSON Schema' }
  ]

  const hasInvalidIntention = intentions.some(item => item.section_intention.trim().length === 0 || item.section.trim().length === 0)

  const handleSave = async () => {
    if (!templateForm.slug || !templateForm.name || !mergedPromptTemplate.trim()) {
      showToast('Template slug, name, and at least one intention section are required.', 'error')
      return
    }

    if (hasInvalidIntention) {
      showToast('Each intention needs both section intention and section content.', 'error')
      return
    }

    setIsSaving(true)

    try {
      const normalizedIntentions = intentions
        .filter(item => item.section_intention.trim() && item.section.trim())
        .map((item, index) => ({
          section_intention: item.section_intention.trim(),
          section: item.section.trim(),
          position: index
        }))

      const submitData = {
        slug: templateForm.slug,
        name: templateForm.name,
        system_prompt: templateForm.system_prompt,
        user_prompt_template: mergedPromptTemplate,
        description: templateForm.description || null,
        is_active: templateForm.is_active,
        use_structured_output: templateForm.use_structured_output,
        structured_output_schema: templateForm.structured_output_schema,
        structured_output_format: templateForm.use_structured_output ? templateForm.structured_output_format : null,
        prompt_intentions: normalizedIntentions
      }

      if (templateForm.use_structured_output) {
        if (submitData.structured_output_schema.trim() && templateForm.structured_output_format === 'json_schema') {
          try {
            JSON.parse(submitData.structured_output_schema)
          } catch {
            showToast('Invalid JSON in structured output schema. Please check your JSON Schema definition.', 'error')
            setIsSaving(false)
            return
          }
        }
      } else {
        submitData.structured_output_schema = ''
      }

      const method = mode === 'create' ? 'POST' : 'PUT'
      const url = mode === 'create'
        ? '/api/prompt-templates'
        : `/api/prompt-templates/${initialTemplate?.id}`

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        showToast(`Template ${mode === 'create' ? 'created' : 'updated'} successfully`, 'success')
        router.push('/prompt-templates')
        return
      }

      const errorData = await response.json()
      showToast(`Error saving template: ${errorData.error || 'Unknown error'}`, 'error')
    } catch (error) {
      console.error('Error saving prompt template:', error)
      showToast('Error saving prompt template. Please try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/prompt-templates')
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <Button size="sm" variant="ghost" onClick={handleCancel} className={styles.backButton}>
          <ArrowLeft size={16} />
          Back
        </Button>
        <h1 className={styles.pageTitle}>
          {mode === 'create' ? 'Create Prompt Template' : 'Edit Prompt Template'}
        </h1>
      </header>

      <section className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Template details</h2>

        <div className={styles.formGrid}>
          <div className={styles.formTopRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Template Name</label>
              <Input
                size="sm"
                value={templateForm.name}
                onChange={(value) => setTemplateForm({ ...templateForm, name: value })}
                placeholder="e.g., Blog Post Generator"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Slug</label>
              <Input
                size="sm"
                value={templateForm.slug}
                onChange={(value) => {
                  const filteredValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  setTemplateForm({ ...templateForm, slug: filteredValue })
                }}
                placeholder="e.g., blog-post-generator"
                className={slugError ? styles.inputError : ''}
              />
              {slugError && <div className={styles.fieldError}>{slugError}</div>}
            </div>

            <div className={styles.formField}>
              <Switch
                label="Active"
                checked={templateForm.is_active}
                onChange={(checked) => setTemplateForm({ ...templateForm, is_active: checked })}
                size="sm"
              />
              <div className={styles.helperText}>
                Active templates can be used in runbooks and content generation.
              </div>
            </div>
          </div>

          <div className={`${styles.formField} ${styles.formFieldHalf}`}>
            <label className={styles.formLabel}>Description (Optional)</label>
            <Textarea
              size="sm"
              value={templateForm.description}
              onChange={(value) => setTemplateForm({ ...templateForm, description: value })}
              placeholder="Brief description of what this template does"
            />
          </div>

          <div className={`${styles.formField} ${styles.formFieldHalf}`}>
            <label className={styles.formLabel}>System Prompt (Optional)</label>
            <Textarea
              size="sm"
              value={templateForm.system_prompt}
              onChange={(value) => setTemplateForm({ ...templateForm, system_prompt: value })}
              placeholder="System instructions for the AI..."
            />
          </div>
        </div>
      </section>

      <div className={styles.intentionSection}>
        <div className={styles.intentionList}>
          {intentions.map((intention, index) => (
            <section key={intention.id} className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Intention #{index + 1}</h2>
                <div className={styles.intentionRowActions}>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => moveIntention(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move section ${index + 1} up`}
                  >
                    <ChevronUp size={14} />
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => moveIntention(index, 1)}
                    disabled={index === intentions.length - 1}
                    aria-label={`Move section ${index + 1} down`}
                  >
                    <ChevronDown size={14} />
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => removeIntention(index)}
                    className={styles.buttonDanger}
                    aria-label={`Delete section ${index + 1}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>What do you want this section to achieve?</label>
                <Input
                  size="sm"
                  value={intention.section_intention}
                  onChange={(value) => updateIntention(index, 'section_intention', value)}
                  placeholder="Describe your goal and the system will craft it."
                />
              </div>

              <div className={styles.formField}>
                <div className={styles.sectionLabelRow}>
                  <label className={styles.formLabel}>Section</label>
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => toggleSectionEditMode(intention.id)}
                    aria-label={`Edit section ${index + 1} manually`}
                    disabled={Boolean(sectionLocked[intention.id])}
                  >
                    {sectionEditMode[intention.id] ? 'Close editor' : 'Edit manually'}
                  </Button>
                </div>
              {sectionEditMode[intention.id] ? (
                <Textarea
                  size="sm"
                  value={intention.section}
                  onChange={(value) => updateIntention(index, 'section', value)}
                  placeholder="Write this section prompt content..."
                  className={styles.sectionTextarea}
                  disabled={Boolean(sectionLocked[intention.id])}
                />
              ) : (
                <div className={styles.sectionPreview}>
                  {parseMarkdownBlock(intention.section)}
                </div>
              )}
                {Boolean(isSectionGenerating[intention.id]) && (
                  <div className={styles.helperText}>Generating section content from goal...</div>
                )}
                {sectionGenerationError[intention.id] && (
                  <div className={styles.fieldError}>
                    {sectionGenerationError[intention.id]}
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        <div className={styles.intentionFooter}>
          <Button size="sm" variant="primary" onClick={addIntention}>
            <Plus size={16} />
            {`Add intention #${intentions.length + 1}`}
          </Button>
        </div>
      </div>

      <section className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Structured output</h2>
        <p className={styles.helperText}>
          Configure the structured response format for this prompt template. This is required for downstream pipelines.
        </p>

        <div className={styles.formField}>
          <Switch
            label="Use Structured Outputs"
            checked={templateForm.use_structured_output}
            onChange={(checked) => setTemplateForm({
              ...templateForm,
              use_structured_output: checked
            })}
            size="sm"
          />
        </div>

        {templateForm.use_structured_output && (
          <>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Schema Format</label>
              <PillList
                options={getSchemaOptions()}
                selected={[templateForm.structured_output_format]}
                onChange={(selected) => setTemplateForm({
                  ...templateForm,
                  structured_output_format: selected[0] as 'pydantic' | 'zod' | 'json_schema'
                })}
                variant="single"
                size="xs"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Schema Content</label>
              <JsonTreeViewer
                value={templateForm.structured_output_schema}
                onChange={(value) => setTemplateForm({ ...templateForm, structured_output_schema: value })}
                className={styles.schemaEditor}
              />
              {templateForm.structured_output_format !== 'json_schema' && (
                <div className={styles.helperText}>
                  Store your schema in your preferred format (textual).
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <section className={styles.previewPanel}>
        <label className={styles.formLabel}>Merged user_prompt_template preview</label>
        <Textarea
          size="sm"
          value={mergedPromptTemplate}
          onChange={() => {}}
          disabled
          rows={10}
          className={styles.previewTextarea}
          monospace
        />
      </section>

      <div className={styles.footerBar}>
        <div className={styles.footerActions}>
          <Button size="sm" onClick={handleCancel} disabled={isSaving} variant="secondary">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || Boolean(slugError)}>
            <Save size={16} />
            {isSaving
              ? 'Saving...'
              : mode === 'create' ? 'Create template' : 'Update template'}
          </Button>
        </div>
      </div>
    </div>
  )
}
