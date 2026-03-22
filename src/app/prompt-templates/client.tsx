'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  IconAction,
  Textarea,
  ExpandableTable,
  useToast,
  type TableColumn,
  JsonTreeViewer,
} from '@/components/interaction'
import { Plus, Pencil, Trash2, Braces } from 'lucide-react'
import { formatHumanReadableDate } from '@/utils/time'
import styles from './client.module.css'

interface PromptTemplate {
  id: string
  slug: string
  name: string
  system_prompt: string | null
  user_prompt_template: string
  version: number
  is_active: boolean
  description: string | null
  created_at: string
  updated_at: string
  use_structured_output: boolean
  structured_output_schema: Record<string, unknown> | string | null
  structured_output_format: 'pydantic' | 'zod' | 'json_schema' | null
}

const stringifySchema = (value: Record<string, unknown> | string | null): string => {
  if (!value) {
    return ''
  }

  return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
}

export const PromptTemplatesClient: React.FC = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { showToast } = useToast()

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
    router.push('/prompt-templates/new')
  }

  const handleEditTemplate = (template: PromptTemplate) => {
    router.push(`/prompt-templates/${template.id}/edit`)
  }

  const handleToggleActive = async (template: PromptTemplate) => {
    try {
      const response = await fetch(`/api/prompt-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: template.slug,
          name: template.name,
          system_prompt: template.system_prompt,
          user_prompt_template: template.user_prompt_template,
          description: template.description,
          is_active: !template.is_active,
          use_structured_output: template.use_structured_output,
          structured_output_schema: template.structured_output_schema,
          structured_output_format: template.structured_output_format
        })
      })

      if (response.ok) {
        fetchTemplates()
        showToast(`Template ${!template.is_active ? 'activated' : 'deactivated'} successfully`, 'success')
      } else {
        const errorData = await response.json()
        showToast(`Error updating template: ${errorData.error || 'Unknown error'}`, 'error')
      }
    } catch (error) {
      console.error('Error toggling template active status:', error)
      showToast('Error updating template status. Please try again.', 'error')
    }
  }

  const handleDeleteTemplate = async (template: PromptTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/prompt-templates/${template.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== template.id))
      } else {
        const errorData = await response.json()
        showToast(`Delete failed: ${errorData.error || 'Unknown error'}`, 'error')
      }
    } catch (error) {
      console.error('Error deleting prompt template:', error)
      showToast('Error deleting prompt template. Please try again.', 'error')
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
      key: 'slug',
      header: 'Slug',
      render: (template) => (
        <code className={styles.slugCode}>{template.slug}</code>
      )
    },
    {
      key: 'version',
      header: 'Version',
      render: (template) => (
        <span className={styles.versionBadge}>
          v{template.version}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (template) => (
        <span
          className={`${styles.statusPill} ${template.is_active ? styles.statusActive : styles.statusInactive} ${styles.statusClickable}`}
          onClick={() => handleToggleActive(template)}
          title={`Click to ${template.is_active ? 'deactivate' : 'activate'} this template`}
        >
          {template.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (template) => (
        <span className={styles.createdText}>
          {formatHumanReadableDate(template.created_at)}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (template) => (
        <div className={styles.templateActions}>
          <IconAction
            icon={Pencil}
            size="xs"
            variant="ghost"
            onClick={() => handleEditTemplate(template)}
            ariaLabel="Edit template"
          />
          <IconAction
            icon={Trash2}
            size="xs"
            variant="ghost"
            onClick={() => handleDeleteTemplate(template)}
            ariaLabel="Delete template"
            className={styles.iconActionDanger}
          />
        </div>
      )
    }
  ]

  const renderExpandableContent = (template: PromptTemplate) => {
    const structuredOutputSchemaText = stringifySchema(template.structured_output_schema)
    const isJsonSchema = template.structured_output_format === 'json_schema'

    return (
      <div className={styles.expandedContent}>
        <div className={styles.expandedPromptGrid}>
          {template.system_prompt && (
            <div className={styles.expandedSection}>
              <h4 className={styles.expandedSectionTitle}>System Prompt</h4>
              <Textarea
                size="sm"
                value={template.system_prompt}
                onChange={() => {}}
                className={styles.expandedPromptTextarea}
                monospace
              />
            </div>
          )}

          <div className={styles.expandedSection}>
            <h4 className={styles.expandedSectionTitle}>User Prompt Template</h4>
            <Textarea
              size="sm"
              value={template.user_prompt_template}
              onChange={() => {}}
              className={styles.expandedPromptTextarea}
              monospace
            />
          </div>

          {template.use_structured_output && template.structured_output_schema && (
            <div className={styles.expandedSection}>
              <h4 className={styles.expandedSectionTitle}>Structured Output Schema ({template.structured_output_format})</h4>
              {isJsonSchema ? (
                <JsonTreeViewer value={structuredOutputSchemaText} disabled rows={2} />
              ) : (
                <pre>{structuredOutputSchemaText}</pre>
              )}
            </div>
          )}
        </div>

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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
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
        size="xs"
        emptyMessage="No prompt templates found. Create your first template to get started."
      />
    </div>
  )
}
