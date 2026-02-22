'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button, Input, Textarea, ExpandableTable, Drawer, PillList, type TableColumn } from '@/components/interaction'
import { Pencil, Trash2 } from 'lucide-react'
import styles from './client.module.css'

interface Provider {
  id: string
  name: string
  base_url: string
  is_active: boolean
  global_timeout_seconds: number
  max_retries: number
  notes: string | null
  created_at: string
  updated_at: string
  ai_models?: Model[]
}

interface Model {
  id: string
  provider_id: string
  model_identifier: string
  display_name: string
  context_window_tokens: number | null
  max_output_tokens: number | null
  supports_vision: boolean
  supports_tools: boolean
  input_cost_per_million_tokens: number | null
  output_cost_per_million_tokens: number | null
  is_enabled: boolean
  deprecated_at: string | null
  created_at: string
  updated_at: string
  ai_endpoints?: Endpoint[]
}

interface Endpoint {
  id: string
  slug: string
  model_id: string
  api_path: string
  http_method: string
  default_temperature: number | null
  default_max_tokens: number | null
  default_top_p: number | null
  supports_streaming: boolean
  is_active: boolean
  description: string | null
  created_at: string
  updated_at: string
  ai_models?: Model & { ai_providers?: Provider }
}

// Model expandable content
function getModelExpandableContent(model: Model, index: number) {
  return (
    <div className={styles.modelExpandableContent}>
      <div className={styles.modelGrid}>
        <div>
          <h4 className={styles.sectionHeading}>Technical Details</h4>
          <div className={styles.detailsList}>
            <div><span className={styles.label}>Model ID:</span> {model.model_identifier}</div>
            <div><span className={styles.label}>Context Window:</span> {model.context_window_tokens?.toLocaleString() || 'N/A'} tokens</div>
            <div><span className={styles.label}>Max Output:</span> {model.max_output_tokens?.toLocaleString() || 'N/A'} tokens</div>
          </div>
        </div>
        <div>
          <h4 className={styles.sectionHeading}>Capabilities</h4>
          <div className={styles.detailsList}>
            <div><span className={styles.label}>Vision:</span> {model.supports_vision ? 'Yes' : 'No'}</div>
            <div><span className={styles.label}>Tools:</span> {model.supports_tools ? 'Yes' : 'No'}</div>
            <div><span className={styles.label}>Status:</span> {model.is_enabled ? 'Enabled' : 'Disabled'}</div>
          </div>
        </div>
      </div>

      {(model.input_cost_per_million_tokens || model.output_cost_per_million_tokens) && (
        <div>
          <h4 className={styles.sectionHeading}>Pricing</h4>
          <div className={styles.pricingGrid}>
            {model.input_cost_per_million_tokens && (
              <div><span style={{ fontWeight: 500 }}>Input:</span> ${model.input_cost_per_million_tokens.toFixed(6)} per million tokens</div>
            )}
            {model.output_cost_per_million_tokens && (
              <div><span style={{ fontWeight: 500 }}>Output:</span> ${model.output_cost_per_million_tokens.toFixed(6)} per million tokens</div>
            )}
          </div>
        </div>
      )}

      {model.deprecated_at && (
        <div className={styles.deprecatedWarning}>
          <div className={styles.deprecatedText}>
            <span style={{ fontWeight: 500 }}>Deprecated:</span> This model was deprecated on {new Date(model.deprecated_at).toLocaleDateString()}
          </div>
        </div>
      )}

      <div className={styles.timestamp}>
        Created: {new Date(model.created_at).toLocaleDateString()} |
        Updated: {new Date(model.updated_at).toLocaleDateString()}
      </div>
    </div>
  );
}

export function LLMModelsConfigClient() {
  const [activeTab, setActiveTab] = useState<'providers' | 'models' | 'endpoints'>('providers')
  const [showProviderForm, setShowProviderForm] = useState(false)
  const [showModelForm, setShowModelForm] = useState(false)
  const [showEndpointForm, setShowEndpointForm] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [editingModel, setEditingModel] = useState<Model | null>(null)
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null)
  const [currentProviders, setCurrentProviders] = useState<Provider[]>([])
  const [currentModels, setCurrentModels] = useState<Model[]>([])
  const [currentEndpoints, setCurrentEndpoints] = useState<Endpoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsInitialLoading(true)

        // Fetch providers
        const providersResponse = await fetch('/api/ai-providers')
        if (providersResponse.ok) {
          const { providers } = await providersResponse.json()
          setCurrentProviders(providers)
        }

        // Fetch models
        const modelsResponse = await fetch('/api/ai-models')
        if (modelsResponse.ok) {
          const { models } = await modelsResponse.json()
          setCurrentModels(models)
        }

        // Fetch endpoints
        const endpointsResponse = await fetch('/api/ai-endpoints')
        if (endpointsResponse.ok) {
          const { endpoints } = await endpointsResponse.json()
          setCurrentEndpoints(endpoints)
        }
      } catch (error) {
        console.error('Error fetching initial data:', error)
      } finally {
        setIsInitialLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  const handleProviderSubmit = useCallback(async (formData: {
    name: string
    base_url: string
    is_active: boolean
    global_timeout_seconds: number
    max_retries: number
    notes: string
  }) => {
    setIsLoading(true)
    try {
      if (editingProvider) {
        const response = await fetch(`/api/ai-providers/${editingProvider.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update provider')
        }

        const { provider } = await response.json()

        setCurrentProviders(prev =>
          prev.map(p => p.id === editingProvider.id ? provider : p)
        )
      } else {
        const response = await fetch('/api/ai-providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create provider')
        }

        const { provider } = await response.json()

        setCurrentProviders(prev => [provider, ...prev])
      }

      setShowProviderForm(false)
      setEditingProvider(null)
    } catch (error) {
      console.error('Error saving provider:', error)
      alert(error instanceof Error ? error.message : 'Failed to save provider. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [editingProvider])

  const handleModelSubmit = useCallback(async (formData: {
    provider_id: string
    model_identifier: string
    display_name: string
    context_window_tokens: number | null
    max_output_tokens: number | null
    supports_vision: boolean
    supports_tools: boolean
    input_cost_per_million_tokens: number | null
    output_cost_per_million_tokens: number | null
    is_enabled: boolean
  }) => {
    setIsLoading(true)
    try {
      if (editingModel) {
        const response = await fetch(`/api/ai-models/${editingModel.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update model')
        }

        const { model } = await response.json()

        // Update the model in the models state
        setCurrentModels(prev =>
          prev.map(m => m.id === editingModel.id ? model : m)
        )
      } else {
        const response = await fetch('/api/ai-models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create model')
        }

        const { model } = await response.json()

        // Add the model to the models state
        setCurrentModels(prev => [model, ...prev])
      }

      setShowModelForm(false)
      setEditingModel(null)
    } catch (error) {
      console.error('Error saving model:', error)
      alert(error instanceof Error ? error.message : 'Failed to save model. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [editingModel])

  const handleEndpointSubmit = useCallback(async (formData: {
    slug: string
    model_id: string
    api_path: string
    http_method: string
    default_temperature: number | null
    default_max_tokens: number | null
    default_top_p: number | null
    supports_streaming: boolean
    is_active: boolean
    description: string
  }) => {
    setIsLoading(true)
    try {
      if (editingEndpoint) {
        const response = await fetch(`/api/ai-endpoints/${editingEndpoint.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update endpoint')
        }

        const { endpoint } = await response.json()

        setCurrentEndpoints(prev =>
          prev.map(e => e.id === editingEndpoint.id ? endpoint : e)
        )
      } else {
        const response = await fetch('/api/ai-endpoints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create endpoint')
        }

        const { endpoint } = await response.json()

        setCurrentEndpoints(prev => [endpoint, ...prev])
      }

      setShowEndpointForm(false)
      setEditingEndpoint(null)
    } catch (error) {
      console.error('Error saving endpoint:', error)
      alert(error instanceof Error ? error.message : 'Failed to save endpoint. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [editingEndpoint])

  const handleDeleteProvider = useCallback(async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this provider? This will also delete all associated models and endpoints.')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/ai-providers/${providerId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete provider')
      }

      setCurrentProviders(prev => prev.filter(p => p.id !== providerId))
    } catch (error) {
      console.error('Error deleting provider:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete provider. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDeleteModel = useCallback(async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this model? This will also delete all associated endpoints.')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/ai-models/${modelId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete model')
      }

      setCurrentModels(prev => prev.filter(m => m.id !== modelId))
    } catch (error) {
      console.error('Error deleting model:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete model. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDeleteEndpoint = useCallback(async (endpointId: string) => {
    if (!confirm('Are you sure you want to delete this endpoint?')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/ai-endpoints/${endpointId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete endpoint')
      }

      setCurrentEndpoints(prev =>
        prev.filter(e => e.id !== endpointId)
      )
    } catch (error) {
      console.error('Error deleting endpoint:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete endpoint. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  if (isInitialLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.tabsContainer}>
      {/* Tab Navigation */}
      <div className={styles.tabButtons}>
        {[
          { id: 'providers', label: 'AI Providers' },
          { id: 'models', label: 'Models' },
          { id: 'endpoints', label: 'Endpoints' }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`rounded-t-md ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div className={styles.tabContent}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>AI Providers</h2>
            <Button
              size="sm"
              onClick={() => {
                setEditingProvider(null)
                setShowProviderForm(true)
              }}
            >
              Add Provider
            </Button>
          </div>

          <ExpandableTable
            data={currentProviders}
            columns={[
              {
                key: 'name',
                header: 'Name',
                render: (provider) => (
                  <span className={styles.providerName}>{provider.name}</span>
                ),
              },
              {
                key: 'base_url',
                header: 'Base URL',
                render: (provider) => (
                  <span className={styles.providerUrl}>{provider.base_url}</span>
                ),
              },
              {
                key: 'is_active',
                header: 'Status',
                render: (provider) => (
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    provider.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {provider.is_active ? 'Active' : 'Inactive'}
                  </span>
                ),
              },
              {
                key: 'models',
                header: 'Models',
                render: (provider) => (
                  <span className={styles.providerUrl}>
                    {currentModels.filter(m => m.provider_id === provider.id).length}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                className: 'text-right',
                render: (provider, index) => (
                  <div className={styles.actionButtons}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingProvider(provider)
                        setShowProviderForm(true)
                      }}
                      aria-label="Edit provider"
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteProvider(provider.id)}
                      disabled={isLoading}
                      aria-label="Delete provider"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ),
              },
            ]}
            expandableContent={(provider, index) => (
              <div className={styles.providerDetails}>
                <div className={styles.detailsGrid}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 500, color: '#111827', marginBottom: '8px' }}>Configuration</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px' }}>
                      <div><span style={{ fontWeight: 500 }}>Base URL:</span> {provider.base_url}</div>
                      <div><span style={{ fontWeight: 500 }}>Timeout:</span> {provider.global_timeout_seconds}s</div>
                      <div><span style={{ fontWeight: 500 }}>Max Retries:</span> {provider.max_retries}</div>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 500, color: '#111827', marginBottom: '8px' }}>Models</h4>
                    <div className={styles.modelsList}>
                      {currentModels.filter(m => m.provider_id === provider.id).length} models configured
                    </div>
                    {currentModels.filter(m => m.provider_id === provider.id).length > 0 && (
                      <div className={styles.modelsCountContainer}>
                        <div className={styles.modelsCount}>Active Models:</div>
                        <div className={styles.modelTags}>
                          {currentModels
                            .filter(m => m.provider_id === provider.id && m.is_enabled)
                            .slice(0, 3)
                            .map(model => (
                              <span key={model.id} className={styles.modelTag}>
                                {model.display_name}
                              </span>
                            ))
                          }
                          {currentModels.filter(m => m.provider_id === provider.id && m.is_enabled).length > 3 && (
                            <span className={styles.timestamp}>
                              +{currentModels.filter(m => m.provider_id === provider.id && m.is_enabled).length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {provider.notes && (
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 500, color: '#111827', marginBottom: '8px' }}>Notes</h4>
                    <p className={styles.modelsList}>{provider.notes}</p>
                  </div>
                )}

                <div className={styles.timestamp}>
                  Created: {new Date(provider.created_at).toLocaleDateString()} |
                  Updated: {new Date(provider.updated_at).toLocaleDateString()}
                </div>
              </div>
            )}
            getRowKey={(provider) => provider.id}
            emptyMessage="No providers configured yet"
          />
        </div>
      )}

      {/* Models Tab */}
      {activeTab === 'models' && (
        <div className={styles.tabContent}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>AI Models</h2>
            <Button
              size="sm"
              onClick={() => {
                setEditingModel(null)
                setShowModelForm(true)
              }}
            >
              Add Model
            </Button>
          </div>

          <ExpandableTable
            data={currentModels}
            columns={[
              {
                key: 'display_name',
                header: 'Model',
                render: (model) => (
                  <div>
                    <div className={styles.providerName}>{model.display_name}</div>
                    <div className={styles.providerUrl}>{model.model_identifier}</div>
                  </div>
                ),
              },
              {
                key: 'provider_id',
                header: 'Provider',
                render: (model) => (
                  <span className={styles.providerUrl}>
                    {currentProviders.find(p => p.id === model.provider_id)?.name || 'Unknown Provider'}
                  </span>
                ),
              },
              {
                key: 'context_window_tokens',
                header: 'Context Window',
                render: (model) => (
                  <span className={styles.providerUrl}>
                    {model.context_window_tokens?.toLocaleString() || 'N/A'}
                  </span>
                ),
              },
              {
                key: 'supports_vision',
                header: 'Features',
                render: (model) => (
                  <div className={styles.capabilitiesContainer}>
                    {model.supports_vision && (
                      <span className={styles.visionBadge}>
                        Vision
                      </span>
                    )}
                    {model.supports_tools && (
                      <span className={styles.toolsBadge}>
                        Tools
                      </span>
                    )}
                  </div>
                ),
              },
              {
                key: 'is_enabled',
                header: 'Status',
                render: (model) => (
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    model.is_enabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {model.is_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                className: 'text-right',
                render: (model, index) => (
                  <div className={styles.actionButtons}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingModel(model)
                        setShowModelForm(true)
                      }}
                      aria-label="Edit model"
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteModel(model.id)}
                      disabled={isLoading}
                      aria-label="Delete model"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ),
              },
            ]}
            expandableContent={getModelExpandableContent}
            getRowKey={(model) => model.id}
            emptyMessage="No models configured yet"
          />
        </div>
      )}

      {/* Endpoints Tab */}
      {activeTab === 'endpoints' && (
        <div className={styles.tabContent}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>AI Endpoints</h2>
            <Button
              size="sm"
              onClick={() => {
                setEditingEndpoint(null)
                setShowEndpointForm(true)
              }}
            >
              Add Endpoint
            </Button>
          </div>

          <ExpandableTable
            data={currentEndpoints}
            columns={[
              {
                key: 'slug',
                header: 'Slug',
                render: (endpoint) => (
                  <span className={styles.providerName}>{endpoint.slug}</span>
                ),
              },
              {
                key: 'model',
                header: 'Model',
                render: (endpoint) => (
                  <div>
                    <div className={styles.endpointDisplayName}>
                      {endpoint.ai_models?.display_name}
                    </div>
                    <div className={styles.providerUrl}>
                      {endpoint.ai_models?.ai_providers?.name}
                    </div>
                  </div>
                ),
              },
              {
                key: 'api_path',
                header: 'API Path',
                render: (endpoint) => (
                  <span className={styles.providerUrl}>{endpoint.api_path}</span>
                ),
              },
              {
                key: 'http_method',
                header: 'Method',
                render: (endpoint) => (
                  <span className={styles.providerUrl}>{endpoint.http_method}</span>
                ),
              },
              {
                key: 'default_temperature',
                header: 'Temperature',
                render: (endpoint) => (
                  <span className={styles.providerUrl}>
                    {endpoint.default_temperature || 'Default'}
                  </span>
                ),
              },
              {
                key: 'is_active',
                header: 'Status',
                render: (endpoint) => (
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    endpoint.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {endpoint.is_active ? 'Active' : 'Inactive'}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                className: 'text-right',
                render: (endpoint, index) => (
                  <div className={styles.actionButtons}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingEndpoint(endpoint)
                        setShowEndpointForm(true)
                      }}
                      aria-label="Edit endpoint"
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteEndpoint(endpoint.id)}
                      disabled={isLoading}
                      aria-label="Delete endpoint"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ),
              },
            ]}
            expandableContent={(endpoint, index) => (
              <div className={styles.providerDetails}>
                <div className={styles.detailsGrid}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 500, color: '#111827', marginBottom: '8px' }}>Configuration</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px' }}>
                      <div><span style={{ fontWeight: 500 }}>API Path:</span> {endpoint.api_path}</div>
                      <div><span style={{ fontWeight: 500 }}>HTTP Method:</span> {endpoint.http_method}</div>
                      <div><span style={{ fontWeight: 500 }}>Supports Streaming:</span> {endpoint.supports_streaming ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 500, color: '#111827', marginBottom: '8px' }}>Default Parameters</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px' }}>
                      <div><span style={{ fontWeight: 500 }}>Temperature:</span> {endpoint.default_temperature || 'Not set'}</div>
                      <div><span style={{ fontWeight: 500 }}>Max Tokens:</span> {endpoint.default_max_tokens || 'Not set'}</div>
                      <div><span style={{ fontWeight: 500 }}>Top-P:</span> {endpoint.default_top_p || 'Not set'}</div>
                    </div>
                  </div>
                </div>

                {endpoint.description && (
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 500, color: '#111827', marginBottom: '8px' }}>Description</h4>
                    <p className={styles.modelsList}>{endpoint.description}</p>
                  </div>
                )}

                <div className={styles.timestamp}>
                  Created: {new Date(endpoint.created_at).toLocaleDateString()} |
                  Updated: {new Date(endpoint.updated_at).toLocaleDateString()}
                </div>
              </div>
            )}
            getRowKey={(endpoint) => endpoint.id}
            emptyMessage="No endpoints configured yet"
          />
        </div>
      )}

      {/* Provider Form Drawer */}
      <Drawer
        isOpen={showProviderForm}
        onClose={() => {
          setShowProviderForm(false)
          setEditingProvider(null)
        }}
        position="right"
      >
        <ProviderForm
          provider={editingProvider}
          onSubmit={handleProviderSubmit}
          onCancel={() => {
            setShowProviderForm(false)
            setEditingProvider(null)
          }}
          isLoading={isLoading}
        />
      </Drawer>

      {/* Model Form Drawer */}
      <Drawer
        isOpen={showModelForm}
        onClose={() => {
          setShowModelForm(false)
          setEditingModel(null)
        }}
        position="right"
      >
        <ModelForm
          model={editingModel}
          providers={currentProviders}
          onSubmit={handleModelSubmit}
          onCancel={() => {
            setShowModelForm(false)
            setEditingModel(null)
          }}
          isLoading={isLoading}
        />
      </Drawer>

      {/* Endpoint Form Drawer */}
      <Drawer
        isOpen={showEndpointForm}
        onClose={() => {
          setShowEndpointForm(false)
          setEditingEndpoint(null)
        }}
        position="right"
      >
        <EndpointForm
          endpoint={editingEndpoint}
          providers={currentProviders}
          models={currentModels}
          onSubmit={handleEndpointSubmit}
          onCancel={() => {
            setShowEndpointForm(false)
            setEditingEndpoint(null)
          }}
          isLoading={isLoading}
        />
      </Drawer>
    </div>
  )
}

// Provider Form Component
function ProviderForm({
  provider,
  onSubmit,
  onCancel,
  isLoading
}: {
  provider: Provider | null
  onSubmit: (data: {
    name: string
    base_url: string
    is_active: boolean
    global_timeout_seconds: number
    max_retries: number
    notes: string
  }) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: provider?.name || '',
    base_url: provider?.base_url || '',
    is_active: provider?.is_active ?? true,
    global_timeout_seconds: provider?.global_timeout_seconds || 30,
    max_retries: provider?.max_retries || 3,
    notes: provider?.notes || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div>
      <h3 className={styles.drawerTitle}>
        {provider ? 'Edit Provider' : 'Add Provider'}
      </h3>

      <form onSubmit={handleSubmit} className={styles.drawerForm}>
        <Input
          label="Name"
          value={formData.name}
          onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
          required
          placeholder="e.g. xAI Grok"
        />

        <Input
          label="Base URL"
          value={formData.base_url}
          onChange={(value) => setFormData(prev => ({ ...prev, base_url: value }))}
          required
          placeholder="e.g. https://api.x.ai/v1"
        />

        <div className={styles.checkboxContainer}>
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
            className={styles.checkboxInput}
          />
          <label htmlFor="is_active" className={styles.formLabel}>
            Active
          </label>
        </div>

        <Input
          label="Global Timeout (seconds)"
          type="number"
          value={formData.global_timeout_seconds.toString()}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            global_timeout_seconds: parseInt(value) || 30
          }))}
        />

        <Input
          label="Max Retries"
          type="number"
          value={formData.max_retries.toString()}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            max_retries: parseInt(value) || 3
          }))}
        />

        <Textarea
          label="Notes"
          value={formData.notes}
          onChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
          placeholder="Internal documentation..."
          rows={3}
        />

        <div className={styles.formActions}>
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : (provider ? 'Update' : 'Create')}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Model Form Component
function ModelForm({
  model,
  providers,
  onSubmit,
  onCancel,
  isLoading
}: {
  model: Model | null
  providers: Provider[]
  onSubmit: (data: {
    provider_id: string
    model_identifier: string
    display_name: string
    context_window_tokens: number | null
    max_output_tokens: number | null
    supports_vision: boolean
    supports_tools: boolean
    input_cost_per_million_tokens: number | null
    output_cost_per_million_tokens: number | null
    is_enabled: boolean
  }) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    provider_id: model?.provider_id || providers[0]?.id || '',
    model_identifier: model?.model_identifier || '',
    display_name: model?.display_name || '',
    context_window_tokens: model?.context_window_tokens || null,
    max_output_tokens: model?.max_output_tokens || null,
    supports_vision: model?.supports_vision ?? false,
    supports_tools: model?.supports_tools ?? false,
    input_cost_per_million_tokens: model?.input_cost_per_million_tokens || null,
    output_cost_per_million_tokens: model?.output_cost_per_million_tokens || null,
    is_enabled: model?.is_enabled ?? true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div>
      <h3 className={styles.drawerTitle}>
        {model ? 'Edit Model' : 'Add Model'}
      </h3>

      <form onSubmit={handleSubmit} className={styles.drawerForm}>
        <div>
          <label className={styles.formLabel}>
            Provider
          </label>
          <select
            value={formData.provider_id}
            onChange={(e) => setFormData(prev => ({ ...prev, provider_id: e.target.value }))}
            className={styles.formInput}
            required
          >
            <option value="">Select a provider...</option>
            {providers.map(provider => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Model Identifier"
          value={formData.model_identifier}
          onChange={(value) => setFormData(prev => ({ ...prev, model_identifier: value }))}
          required
          placeholder="e.g. grok-3"
        />

        <Input
          label="Display Name"
          value={formData.display_name}
          onChange={(value) => setFormData(prev => ({ ...prev, display_name: value }))}
          required
          placeholder="e.g. Grok 3"
        />

        <Input
          label="Context Window (tokens)"
          type="number"
          value={formData.context_window_tokens?.toString() || ''}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            context_window_tokens: value ? parseInt(value) : null
          }))}
          placeholder="e.g. 131072"
        />

        <Input
          label="Max Output Tokens"
          type="number"
          value={formData.max_output_tokens?.toString() || ''}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            max_output_tokens: value ? parseInt(value) : null
          }))}
          placeholder="e.g. 4096"
        />

        <div className={styles.drawerBody}>
          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="supports_vision"
              checked={formData.supports_vision}
              onChange={(e) => setFormData(prev => ({ ...prev, supports_vision: e.target.checked }))}
              className={styles.checkboxInput}
            />
            <label htmlFor="supports_vision" className={styles.formLabel}>
              Supports Vision
            </label>
          </div>

          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="supports_tools"
              checked={formData.supports_tools}
              onChange={(e) => setFormData(prev => ({ ...prev, supports_tools: e.target.checked }))}
              className={styles.checkboxInput}
            />
            <label htmlFor="supports_tools" className={styles.formLabel}>
              Supports Tools
            </label>
          </div>

          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="is_enabled"
              checked={formData.is_enabled}
              onChange={(e) => setFormData(prev => ({ ...prev, is_enabled: e.target.checked }))}
              className={styles.checkboxInput}
            />
            <label htmlFor="is_enabled" className={styles.formLabel}>
              Enabled
            </label>
          </div>
        </div>

        <Input
          label="Input Cost (per million tokens)"
          type="number"
          value={formData.input_cost_per_million_tokens?.toString() || ''}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            input_cost_per_million_tokens: value ? parseFloat(value) : null
          }))}
          placeholder="e.g. 0.000005"
        />

        <Input
          label="Output Cost (per million tokens)"
          type="number"
          value={formData.output_cost_per_million_tokens?.toString() || ''}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            output_cost_per_million_tokens: value ? parseFloat(value) : null
          }))}
          placeholder="e.g. 0.000015"
        />

        <div className={styles.formActions}>
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : (model ? 'Update' : 'Create')}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Endpoint Form Component
function EndpointForm({
  endpoint,
  providers,
  models,
  onSubmit,
  onCancel,
  isLoading
}: {
  endpoint: Endpoint | null
  providers: Provider[]
  models: Model[]
  onSubmit: (data: {
    slug: string
    model_id: string
    api_path: string
    http_method: string
    default_temperature: number | null
    default_max_tokens: number | null
    default_top_p: number | null
    supports_streaming: boolean
    is_active: boolean
    description: string
  }) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    slug: endpoint?.slug || '',
    model_id: endpoint?.model_id || '',
    api_path: endpoint?.api_path || '',
    http_method: endpoint?.http_method || 'POST',
    default_temperature: endpoint?.default_temperature || null,
    default_max_tokens: endpoint?.default_max_tokens || null,
    default_top_p: endpoint?.default_top_p || null,
    supports_streaming: endpoint?.supports_streaming ?? false,
    is_active: endpoint?.is_active ?? true,
    description: endpoint?.description || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const availableModels = models

  // Generate URL-safe slug from model display name
  const generateSlugFromModel = (modelId: string): string => {
    const model = models.find(m => m.id === modelId)
    if (!model) return ''

    // Convert display name to URL-safe slug
    return model.display_name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  }

  // Auto-suggest slug when model changes (only for new endpoints)
  useEffect(() => {
    if (formData.model_id && !endpoint) {
      const suggestedSlug = generateSlugFromModel(formData.model_id)
      if (suggestedSlug && !formData.slug) {
        setFormData(prev => ({ ...prev, slug: suggestedSlug }))
      }
    }
  }, [formData.model_id, models, endpoint, formData.slug])

  return (
    <div>
      <h3 className={styles.drawerTitle}>
        {endpoint ? 'Edit Endpoint' : 'Add Endpoint'}
      </h3>

      <form onSubmit={handleSubmit} className={styles.drawerForm}>
        <Input
          label="Slug"
          value={formData.slug}
          onChange={(value) => setFormData(prev => ({ ...prev, slug: value }))}
          required
          placeholder={formData.model_id ? `Suggested: ${generateSlugFromModel(formData.model_id)}` : "Select a model first for auto-suggestion"}
        />

        <div>
          <label className={styles.formLabel}>
            Model
          </label>
          <PillList
            options={availableModels.map(model => {
              const provider = providers.find(p => p.id === model.provider_id)
              return {
                id: model.id,
                label: `${model.display_name} (${provider?.name})`
              }
            })}
            selected={formData.model_id ? [formData.model_id] : []}
            onChange={(selected) => setFormData(prev => ({ ...prev, model_id: selected[0] || '' }))}
            size="xs"
            variant="single"
          />
        </div>

        <Input
          label="API Path"
          value={formData.api_path}
          onChange={(value) => setFormData(prev => ({ ...prev, api_path: value }))}
          required
          placeholder="e.g. /chat/completions"
        />

        <div>
          <label className={styles.formLabel}>
            HTTP Method
          </label>
          <select
            value={formData.http_method}
            onChange={(e) => setFormData(prev => ({ ...prev, http_method: e.target.value }))}
            className={styles.formInput}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        <Input
          label="Default Temperature"
          type="number"
          value={formData.default_temperature?.toString() || ''}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            default_temperature: value ? parseFloat(value) : null
          }))}
          placeholder="e.g. 0.7"
        />

        <Input
          label="Default Max Tokens"
          type="number"
          value={formData.default_max_tokens?.toString() || ''}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            default_max_tokens: value ? parseInt(value) : null
          }))}
          placeholder="e.g. 4096"
        />

        <Input
          label="Default Top-P"
          type="number"
          value={formData.default_top_p?.toString() || ''}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            default_top_p: value ? parseFloat(value) : null
          }))}
          placeholder="e.g. 1.0"
        />

        <div className={styles.drawerBody}>
          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="supports_streaming"
              checked={formData.supports_streaming}
              onChange={(e) => setFormData(prev => ({ ...prev, supports_streaming: e.target.checked }))}
              className={styles.checkboxInput}
            />
            <label htmlFor="supports_streaming" className={styles.formLabel}>
              Supports Streaming
            </label>
          </div>

          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className={styles.checkboxInput}
            />
            <label htmlFor="is_active" className={styles.formLabel}>
              Active
            </label>
          </div>
        </div>

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
          placeholder="What does this endpoint do?"
          rows={3}
        />

        <div className={styles.formActions}>
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : (endpoint ? 'Update' : 'Create')}
          </Button>
        </div>
      </form>
    </div>
  )
}