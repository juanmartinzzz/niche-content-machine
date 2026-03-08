'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button, Input, Textarea, Drawer, useToast, PillList } from '@/components/interaction'
import { Plus, Pencil, Trash2, FileText, Eye } from 'lucide-react'
import { generateSlug, validateSlug } from '@/utils/slug'
import styles from './client.module.css'

interface ContentType {
  id: string
  slug: string
  name: string
  created_at: string
  updated_at: string
}

interface Template {
  id: string
  slug: string
  content_type_id: string
  name: string
  visual_style: 'minimal' | 'bold' | 'modern' | 'classic' | 'clean'
  description: string | null
  created_at: string
  updated_at: string
}

interface ContentTypeWithTemplates extends ContentType {
  templates: Template[]
}

const VISUAL_STYLE_COLORS = {
  minimal: '#6b7280',
  bold: '#dc2626',
  modern: '#2563eb',
  classic: '#16a34a',
  clean: '#ea580c'
} as const

const VISUAL_STYLE_OPTIONS = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'bold', label: 'Bold' },
  { id: 'modern', label: 'Modern' },
  { id: 'classic', label: 'Classic' },
  { id: 'clean', label: 'Clean' }
]

interface ContentTypesTemplatesClientProps {
  showAddButtonInline?: boolean
  title?: string
  subtitle?: string
  onAddContentType?: () => void
}

export const ContentTypesTemplatesClient: React.FC<ContentTypesTemplatesClientProps> = ({
  showAddButtonInline = false,
  title,
  subtitle,
  onAddContentType
}) => {
  const [contentTypes, setContentTypes] = useState<ContentTypeWithTemplates[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingContentType, setEditingContentType] = useState<ContentType | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string | null>(null)
  const { showToast } = useToast()

  const [contentTypeForm, setContentTypeForm] = useState({
    slug: '',
    name: ''
  })

  const [templateForm, setTemplateForm] = useState({
    slug: '',
    name: '',
    visual_style: 'minimal' as Template['visual_style'],
    description: ''
  })

  const [slugError, setSlugError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [contentTypesResponse, templatesResponse] = await Promise.all([
        fetch('/api/content-types'),
        fetch('/api/templates')
      ])

      if (contentTypesResponse.ok && templatesResponse.ok) {
        const contentTypesData = await contentTypesResponse.json()
        const templatesData = await templatesResponse.json()

        // Group templates by content type
        const contentTypesWithTemplates = contentTypesData.map((ct: ContentType) => ({
          ...ct,
          templates: templatesData.filter((t: Template) => t.content_type_id === ct.id)
        }))

        setContentTypes(contentTypesWithTemplates)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      showToast('Error loading data', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-generate slug from name when creating new template
  useEffect(() => {
    if (!editingTemplate && templateForm.name && !templateForm.slug) {
      const suggestedSlug = generateSlug(templateForm.name)
      if (suggestedSlug) {
        setTemplateForm(prev => ({ ...prev, slug: suggestedSlug }))
      }
    }
  }, [templateForm.name, editingTemplate, templateForm.slug])

  // Validate slug format
  useEffect(() => {
    if (templateForm.slug && !validateSlug(templateForm.slug)) {
      setSlugError('Slug must contain only lowercase letters, numbers, and dashes')
    } else {
      setSlugError('')
    }
  }, [templateForm.slug])

  const handleCreateContentType = () => {
    setEditingContentType(null)
    setSelectedContentTypeId(null)
    setContentTypeForm({ slug: '', name: '' })
    setIsDrawerOpen(true)
  }

  const handleEditContentType = (contentType: ContentType) => {
    setEditingContentType(contentType)
    setSelectedContentTypeId(null)
    setContentTypeForm({ slug: contentType.slug, name: contentType.name })
    setIsDrawerOpen(true)
  }

  const handleCreateTemplate = (contentTypeId: string) => {
    setEditingTemplate(null)
    setSelectedContentTypeId(contentTypeId)
    setTemplateForm({ slug: '', name: '', visual_style: 'minimal', description: '' })
    setIsDrawerOpen(true)
  }

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template)
    setSelectedContentTypeId(template.content_type_id)
    setTemplateForm({
      slug: template.slug,
      name: template.name,
      visual_style: template.visual_style,
      description: template.description || ''
    })
    setIsDrawerOpen(true)
  }

  const handleSaveContentType = async () => {
    try {
      const url = editingContentType
        ? `/api/content-types/${editingContentType.id}`
        : '/api/content-types'

      const method = editingContentType ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentTypeForm)
      })

      if (response.ok) {
        showToast(`Content type ${editingContentType ? 'updated' : 'created'} successfully`, 'success')
        setIsDrawerOpen(false)
        fetchData()
      } else {
        showToast('Error saving content type', 'error')
      }
    } catch (error) {
      console.error('Error saving content type:', error)
      showToast('Error saving content type', 'error')
    }
  }

  const handleSaveTemplate = async () => {
    try {
      const url = editingTemplate
        ? `/api/templates/${editingTemplate.id}`
        : '/api/templates'

      const method = editingTemplate ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...templateForm,
          content_type_id: selectedContentTypeId
        })
      })

      if (response.ok) {
        showToast(`Template ${editingTemplate ? 'updated' : 'created'} successfully`, 'success')
        setIsDrawerOpen(false)
        fetchData()
      } else {
        showToast('Error saving template', 'error')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      showToast('Error saving template', 'error')
    }
  }

  const handleDeleteContentType = async (contentType: ContentType) => {
    if (!confirm(`Are you sure you want to delete "${contentType.name}"? This will also delete all associated templates.`)) {
      return
    }

    try {
      const response = await fetch(`/api/content-types/${contentType.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('Content type deleted successfully', 'success')
        fetchData()
      } else {
        showToast('Error deleting content type', 'error')
      }
    } catch (error) {
      console.error('Error deleting content type:', error)
      showToast('Error deleting content type', 'error')
    }
  }

  const handleDeleteTemplate = async (template: Template) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('Template deleted successfully', 'success')
        fetchData()
      } else {
        showToast('Error deleting template', 'error')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      showToast('Error deleting template', 'error')
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <>
      {showAddButtonInline && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              {title || 'Content Types & Templates'}
            </h1>
            <Button onClick={onAddContentType || handleCreateContentType}>
              <Plus size={16} />
              Add Content Type
            </Button>
          </div>
          {subtitle && (
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              {subtitle}
            </p>
          )}
        </>
      )}

      {!showAddButtonInline && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div></div>
          <Button onClick={handleCreateContentType}>
            <Plus size={16} />
            Add Content Type
          </Button>
        </div>
      )}

      <div className={styles.contentTypesGrid}>
        {contentTypes.map((contentType) => (
          <div key={contentType.id} className={styles.contentTypeSection}>
            <div className={styles.contentTypeHeader}>
              <h3 className={styles.contentTypeTitle}>{contentType.name}</h3>
              <div className={styles.contentTypeActions}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditContentType(contentType)}
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteContentType(contentType)}
                  style={{ color: '#dc2626' }}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>

            <div className={styles.templatesSection}>
              <div className={styles.templatesHeader}>
                <Button
                  size="sm"
                  onClick={() => handleCreateTemplate(contentType.id)}
                >
                  <Plus size={14} />
                  Add Template
                </Button>
              </div>

              <div className={styles.templatesGrid}>
                {contentType.templates.map((template) => (
                  <div key={template.id} className={styles.templateCard}>
                    <div className={styles.templateHeader}>
                      <h4 className={styles.templateTitle}>{template.name}</h4>
                      <div className={styles.templateActions}>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Pencil size={12} />
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleDeleteTemplate(template)}
                          style={{ color: '#dc2626' }}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>

                    <div
                      className={styles.visualStylePill}
                      style={{ backgroundColor: VISUAL_STYLE_COLORS[template.visual_style] }}
                    >
                      {template.visual_style}
                    </div>

                    {template.description && (
                      <p className={styles.templateDescription}>
                        {template.description.length > 100
                          ? `${template.description.substring(0, 100)}...`
                          : template.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingContentType ? 'Edit Content Type' : editingTemplate ? 'Edit Template' : selectedContentTypeId ? 'Create Template' : 'Create Content Type'}
      >
        {selectedContentTypeId || editingTemplate ? (
          // Template form
          <>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </h3>
            <div className={styles.form}>
            <div className={styles.formField}>
              <label htmlFor="templateName">Name</label>
              <Input
                id="templateName"
                value={templateForm.name}
                onChange={(value) => setTemplateForm(prev => ({ ...prev, name: value }))}
                placeholder="Template name"
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="templateSlug">Slug</label>
              <Input
                id="templateSlug"
                value={templateForm.slug}
                onChange={(value) => {
                  // Only allow lowercase letters, numbers, and dashes
                  const filteredValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  setTemplateForm(prev => ({ ...prev, slug: filteredValue }))
                }}
                placeholder="template-slug"
                className={slugError ? styles.inputError : ''}
              />
              {slugError && <div className={styles.fieldError}>{slugError}</div>}
            </div>

            <div className={styles.formField}>
              <label htmlFor="visualStyle">Visual Style</label>
              <PillList
                options={VISUAL_STYLE_OPTIONS}
                selected={[templateForm.visual_style]}
                onChange={(selected) => setTemplateForm(prev => ({
                  ...prev,
                  visual_style: selected[0] as Template['visual_style']
                }))}
                size="sm"
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="description">Description</label>
              <Textarea
                id="description"
                value={templateForm.description}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Template description"
                rows={4}
              />
            </div>

            <div className={styles.formActions}>
              <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate}>
                {editingTemplate ? 'Update' : 'Create'} Template
              </Button>
            </div>
          </div>
          </>
        ) : (
          // Content type form
          <>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              {editingContentType ? 'Edit Content Type' : 'Create Content Type'}
            </h3>
            <div className={styles.form}>
            <div className={styles.formField}>
              <label htmlFor="contentTypeSlug">Slug</label>
              <Input
                id="contentTypeSlug"
                value={contentTypeForm.slug}
                onChange={(e) => setContentTypeForm(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="content-type-slug"
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="contentTypeName">Name</label>
              <Input
                id="contentTypeName"
                value={contentTypeForm.name}
                onChange={(e) => setContentTypeForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Content Type Name"
              />
            </div>

            <div className={styles.formActions}>
              <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveContentType}>
                {editingContentType ? 'Update' : 'Create'} Content Type
              </Button>
            </div>
          </div>
          </>
        )}
      </Drawer>
    </>
  )
}