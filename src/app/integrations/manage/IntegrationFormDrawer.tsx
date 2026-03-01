'use client'

import React, { useState, useEffect } from 'react'
import { Drawer, Button, Input, Textarea } from '@/components/interaction'
import { SchemaForm } from './SchemaForm'
import styles from './page.module.css'

interface Integration {
  id: string
  type: string
  name: string
  description?: string
  config: Record<string, any>
  config_schema?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface IntegrationFormDrawerProps {
  isOpen: boolean
  onClose: () => void
  integration: Integration | null
  onSuccess: () => void
}

export function IntegrationFormDrawer({
  isOpen,
  onClose,
  integration,
  onSuccess,
}: IntegrationFormDrawerProps) {
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    description: '',
    config_schema: '',
    is_active: true,
  })
  const [config, setConfig] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!integration

  useEffect(() => {
    if (integration) {
      setFormData({
        type: integration.type,
        name: integration.name,
        description: integration.description || '',
        config_schema: integration.config_schema || '',
        is_active: integration.is_active,
      })
      setConfig(integration.config || {})
    } else {
      setFormData({
        type: '',
        name: '',
        description: '',
        config_schema: '',
        is_active: true,
      })
      setConfig({})
    }
    setError(null)
  }, [integration, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        config,
      }

      const response = await fetch(
        isEditing ? `/api/integrations/${integration!.id}` : '/api/integrations',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save integration')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleConfigSchemaChange = (value: string) => {
    setFormData(prev => ({ ...prev, config_schema: value }))
    // Reset config when schema changes
    setConfig({})
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position="right"
      widthClass="w-96"
    >
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6">
          {isEditing ? 'Edit Integration' : 'Create Integration'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Type"
            value={formData.type}
            onChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            placeholder="e.g., telegram_bot, discord_bot"
            required
          />

          <Input
            label="Name"
            value={formData.name}
            onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
            placeholder="Human-readable name"
            required
          />

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
            placeholder="Optional description"
            rows={2}
            autoResize={true}
          />

          <Textarea
            label="Configuration Schema (JSON)"
            value={formData.config_schema}
            onChange={handleConfigSchemaChange}
            placeholder='{"type": "object", "properties": {...}}'
            rows={2}
            autoResize={true}
            monospace={true}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              style={{ borderRadius: '4px' }}
            />
            <label htmlFor="is_active" style={{ fontSize: '14px' }}>Active</label>
          </div>

          {formData.config_schema && (
            <div>
              <h3 style={{ fontWeight: 500, marginBottom: '8px' }}>Configuration</h3>
              <SchemaForm
                schema={formData.config_schema}
                value={config}
                onChange={setConfig}
              />
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--color-error, #ef4444)', fontSize: '14px' }}>{error}</div>
          )}

          <div className={styles.formButtons}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className={styles.formButton}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={styles.formButton}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}