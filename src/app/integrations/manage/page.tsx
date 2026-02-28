'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Button, ExpandableTable, TableColumn } from '@/components/interaction'
import { IntegrationFormDrawer } from './IntegrationFormDrawer'
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

export default function ManageIntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null)

  const fetchIntegrations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/integrations')
      if (!response.ok) {
        throw new Error('Failed to fetch integrations')
      }
      const data = await response.json()
      setIntegrations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const handleCreate = () => {
    setEditingIntegration(null)
    setDrawerOpen(true)
  }

  const handleEdit = (integration: Integration) => {
    setEditingIntegration(integration)
    setDrawerOpen(true)
  }

  const handleDelete = async (integration: Integration) => {
    if (!confirm(`Are you sure you want to delete "${integration.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/integrations/${integration.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete integration')
      }

      await fetchIntegrations()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete integration')
    }
  }

  const handleFormSuccess = () => {
    setDrawerOpen(false)
    setEditingIntegration(null)
    fetchIntegrations()
  }

  const columns: TableColumn<Integration>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (integration) => (
        <div>
          <div style={{ fontWeight: 500 }}>{integration.name}</div>
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{integration.type}</div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (integration) => (
        <div style={{ fontSize: '14px' }}>{integration.description || '-'}</div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (integration) => (
        <span style={{
          display: 'inline-flex',
          padding: '4px 8px',
          fontSize: '12px',
          fontWeight: 500,
          borderRadius: '9999px',
          backgroundColor: integration.is_active ? 'var(--color-success-light, #dcfce7)' : 'var(--color-surface-light, #f3f4f6)',
          color: integration.is_active ? 'var(--color-success, #166534)' : 'var(--color-text-secondary, #6b7280)'
        }}>
          {integration.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'updated_at',
      header: 'Last Updated',
      render: (integration) => (
        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          {new Date(integration.updated_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (integration) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(integration)}
            className={styles.actionButton}
          >
            <Edit size={16} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(integration)}
            className={styles.deleteButton}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ]

  const expandableContent = (integration: Integration) => (
    <div className={styles.expandableContent}>
      <div className={styles.configSection}>
        <h4>Configuration</h4>
        <pre>
          {JSON.stringify(integration.config, null, 2)}
        </pre>
      </div>
      {integration.config_schema && (
        <div className={styles.configSection}>
          <h4>Configuration Schema</h4>
          <pre>
            {JSON.stringify(JSON.parse(integration.config_schema), null, 2)}
          </pre>
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingState}>Loading integrations...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorState}>Error: {error}</div>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Manage Integrations</h1>
        <Button onClick={handleCreate} className={styles.addButton}>
          <Plus size={16} />
          Add Integration
        </Button>
      </div>

      <ExpandableTable
        data={integrations}
        columns={columns}
        expandableContent={expandableContent}
        getRowKey={(integration) => integration.id}
        emptyMessage="No integrations found. Create your first integration to get started."
      />

      <IntegrationFormDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setEditingIntegration(null)
        }}
        integration={editingIntegration}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}