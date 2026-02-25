'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button, Input, Textarea, ExpandableTable, Drawer, PillList, useToast, type TableColumn } from '@/components/interaction'
import { Plus, Pencil, Trash2, Braces, Copy } from 'lucide-react'
import { formatHumanReadableDate } from '@/utils/time'
import styles from './client.module.css'

interface PromptTemplate {
  id: string
  name: string
  system_prompt: string | null
  user_prompt_template: string
  version: number
  is_active: boolean
  description: string | null
  created_at: string
  updated_at: string
  use_structured_output: boolean
  structured_output_schema: Record<string, unknown> | null
  structured_output_format: 'pydantic' | 'zod' | 'json_schema' | null
}

export const PromptTemplatesClient: React.FC = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null)
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    system_prompt: '',
    user_prompt_template: '',
    description: '',
    use_structured_output: false,
    structured_output_schema: '',
    structured_output_format: 'pydantic'
  })

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/prompt-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch {
      console.error('Error fetching prompt templates')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setFormData({
      name: '',
      system_prompt: '',
      user_prompt_template: '',
      description: '',
      use_structured_output: false,
      structured_output_schema: '',
      structured_output_format: 'pydantic'
    })
    setIsDrawerOpen(true)
  }

  const handleEditTemplate = (template: PromptTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      system_prompt: template.system_prompt || '',
      user_prompt_template: template.user_prompt_template,
      description: template.description || '',
      use_structured_output: template.use_structured_output || false,
      structured_output_schema: template.structured_output_schema
        ? (typeof template.structured_output_schema === 'string'
            ? template.structured_output_schema
            : JSON.stringify(template.structured_output_schema, null, 2))
        : '',
      structured_output_format: template.structured_output_format || 'pydantic'
    })
    setIsDrawerOpen(true)
  }

  const handleSaveTemplate = async () => {
    try {
      // Prepare the data for submission
      const submitData = { ...formData }

      // Handle structured output schema based on format
      if (formData.use_structured_output && formData.structured_output_schema.trim()) {
        if (formData.structured_output_format === 'json_schema') {
          try {
            submitData.structured_output_schema = JSON.parse(formData.structured_output_schema)
          } catch {
            alert('Invalid JSON in structured output schema. Please check your JSON Schema definition.')
            return
          }
        } else {
          // For Pydantic and Zod, store as string for now
          // TODO: Add conversion to JSON Schema for API compatibility
          submitData.structured_output_schema = formData.structured_output_schema.trim()
        }
      } else {
        submitData.structured_output_schema = null
        submitData.structured_output_format = null
      }

      const method = editingTemplate ? 'PUT' : 'POST'
      const url = editingTemplate
        ? `/api/prompt-templates/${editingTemplate.id}`
        : '/api/prompt-templates'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        setIsDrawerOpen(false)
        fetchTemplates()
      } else {
        const errorData = await response.json()
        showToast(`Error saving template: ${errorData.error || 'Unknown error'}`, 'error')
      }
    } catch (error) {
      console.error('Error saving prompt template:', error)
      showToast('Error saving prompt template. Please try again.', 'error')
    }
  }

  const handleDeleteTemplate = async (template: PromptTemplate) => {
    console.log('handleDeleteTemplate called with template:', template)
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      console.log('User cancelled delete')
      return
    }

    console.log('User confirmed delete, making API call')
    try {
      const response = await fetch(`/api/prompt-templates/${template.id}`, {
        method: 'DELETE'
      })

      console.log('Delete API response:', response.status, response.ok)
      if (response.ok) {
        console.log('Delete successful, updating local state')
        // Optimistically update the local state
        setTemplates(prev => prev.filter(t => t.id !== template.id))
      } else {
        const responseText = await response.text()
        console.error('Delete failed - raw response:', responseText)
        console.error('Response status:', response.status)
        console.error('Response ok:', response.ok)

        try {
          const errorData = JSON.parse(responseText)
          console.error('Delete failed - parsed:', errorData)
          showToast(`Delete failed: ${errorData.error || 'Unknown error'}`, 'error')
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError)
          showToast(`Delete failed: ${responseText || 'Unknown error'}`, 'error')
        }
      }
    } catch (error) {
      console.error('Error deleting prompt template:', error)
      showToast('Error deleting prompt template. Please try again.', 'error')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }


  const columns: TableColumn<PromptTemplate>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (template) => (
        <div>
          <div className={styles.templateName}>
            {template.name}
            {template.use_structured_output && (
              <span className={styles.structuredOutputBadge} title={`Structured Output (${template.structured_output_format})`}>
                <Braces size={16} />
              </span>
            )}
          </div>
          {template.description && (
            <div className={styles.templateDescription}>{template.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'version',
      header: 'Version',
      render: (template) => (
        <span className={`${styles.versionBadge} ${template.is_active ? styles.activeBadge : ''}`}>
          v{template.version}
          {template.is_active && ' (Active)'}
        </span>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (template) => formatHumanReadableDate(template.created_at)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (template) => (
        <div className={styles.templateActions}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditTemplate(template)}
            aria-label="Edit template"
          >
            <Pencil size={16} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteTemplate(template)}
            aria-label="Delete template"
            className={styles.buttonDanger}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      )
    }
  ]

  const renderExpandableContent = (template: PromptTemplate) => {
    const structuredOutputSchemaText = template.structured_output_schema
      ? (typeof template.structured_output_schema === 'string'
          ? template.structured_output_schema
          : JSON.stringify(template.structured_output_schema, null, 2))
      : ''

    return (
      <div className={styles.expandedContent}>
        <div className={styles.expandedSection}>
          <h4 className={styles.expandedSectionTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>User Prompt Template</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(template.user_prompt_template)}
              aria-label="Copy User Prompt Template"
              className={styles.copyButton}
            >
              <Copy size={14} />
            </Button>
          </h4>
          <pre className={styles.expandedCodeBlock}>{template.user_prompt_template}</pre>
        </div>

        {template.system_prompt && (
          <div className={styles.expandedSection}>
            <h4 className={styles.expandedSectionTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>System Prompt</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(template.system_prompt)}
                aria-label="Copy System Prompt"
                className={styles.copyButton}
              >
                <Copy size={14} />
              </Button>
            </h4>
            <pre className={styles.expandedCodeBlock}>{template.system_prompt}</pre>
          </div>
        )}

        {template.use_structured_output && template.structured_output_schema && (
          <div className={styles.expandedSection}>
            <h4 className={styles.expandedSectionTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Structured Output Schema ({template.structured_output_format})</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(structuredOutputSchemaText)}
                aria-label="Copy Structured Output Schema"
                className={styles.copyButton}
              >
                <Copy size={14} />
              </Button>
            </h4>
            <pre className={styles.expandedCodeBlock}>
              {structuredOutputSchemaText}
            </pre>
          </div>
        )}

        <div className={styles.expandedSection}>
          <h4 className={styles.expandedSectionTitle}>Last Updated</h4>
          <p className={styles.expandedText}>{formatHumanReadableDate(template.updated_at)}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <div>Loading prompt templates...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Your Prompt Templates
          </h2>
          <p style={{ color: '#6b7280' }}>
            Manage your AI prompt templates for content generation.
          </p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus size={16} style={{ marginRight: '8px' }} />
          Create Template
        </Button>
      </div>

      <ExpandableTable
        data={templates}
        columns={columns}
        expandableContent={renderExpandableContent}
        getRowKey={(template) => template.id}
        emptyMessage="No prompt templates found. Create your first template to get started."
      />

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        position="right"
      >
        <div style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            {editingTemplate ? 'Edit Prompt Template' : 'Create Prompt Template'}
          </h3>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Template Name</label>
            <Input
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              placeholder="e.g., Blog Post Generator"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Description (Optional)</label>
            <Input
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Brief description of what this template does"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>System Prompt (Optional)</label>
            <Textarea
              value={formData.system_prompt}
              onChange={(value) => setFormData({ ...formData, system_prompt: value })}
              placeholder="System instructions for the AI..."
              className={styles.formTextarea}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>User Prompt Template</label>
            <Textarea
              value={formData.user_prompt_template}
              onChange={(value) => setFormData({ ...formData, user_prompt_template: value })}
              placeholder="User prompt template with {{variables}}..."
              className={styles.formTextarea}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>
              <input
                type="checkbox"
                checked={formData.use_structured_output}
                onChange={(e) => setFormData({ ...formData, use_structured_output: e.target.checked })}
                style={{ marginRight: '8px' }}
              />
              Use Structured Outputs
            </label>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
              Enable structured outputs to get responses in a specific JSON format using Pydantic, Zod, or JSON Schema.
            </div>
          </div>

          {formData.use_structured_output && (
            <>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Schema Format</label>
                <PillList
                  options={[
                    { id: 'pydantic', label: 'Pydantic' },
                    { id: 'zod', label: 'Zod' },
                    { id: 'json_schema', label: 'JSON Schema' }
                  ]}
                  selected={[formData.structured_output_format]}
                  onChange={(selected) => setFormData({ ...formData, structured_output_format: selected[0] || 'pydantic' })}
                  variant="single"
                  size="sm"
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Output Schema</label>
                <Textarea
                  value={formData.structured_output_schema}
                  onChange={(value) => setFormData({ ...formData, structured_output_schema: value })}
                  placeholder={`Define your schema here. For example:

Pydantic:
class Response(BaseModel):
    title: str
    summary: str
    tags: List[str]

Zod:
z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string())
})

JSON Schema:
{
  "type": "object",
  "properties": {
    "title": {"type": "string"},
    "summary": {"type": "string"},
    "tags": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["title", "summary"]
}`}
                  className={styles.formTextarea}
                  rows={12}
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '2rem' }}>
            <Button onClick={handleSaveTemplate}>
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  )
}