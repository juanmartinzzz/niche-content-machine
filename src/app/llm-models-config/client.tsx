'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button, Input, Textarea } from '@/components/interaction'

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

export function LLMModelsConfigClient() {
  const [activeTab, setActiveTab] = useState<'providers' | 'models' | 'endpoints'>('providers')
  const [showProviderForm, setShowProviderForm] = useState(false)
  const [showModelForm, setShowModelForm] = useState(false)
  const [showEndpointForm, setShowEndpointForm] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [editingModel, setEditingModel] = useState<Model | null>(null)
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null)
  const [currentProviders, setCurrentProviders] = useState<Provider[]>([])
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

        // Update the model in the providers state
        setCurrentProviders(prev =>
          prev.map(p => ({
            ...p,
            ai_models: p.ai_models?.map(m =>
              m.id === editingModel.id ? model : m
            )
          }))
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

        // Add the model to the appropriate provider
        setCurrentProviders(prev =>
          prev.map(p =>
            p.id === formData.provider_id
              ? { ...p, ai_models: [model, ...(p.ai_models || [])] }
              : p
          )
        )
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

      setCurrentProviders(prev =>
        prev.map(p => ({
          ...p,
          ai_models: p.ai_models?.filter(m => m.id !== modelId)
        }))
      )
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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b border-gray-200">
        {[
          { id: 'providers', label: 'AI Providers' },
          { id: 'models', label: 'Models' },
          { id: 'endpoints', label: 'Endpoints' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">AI Providers</h2>
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

          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Models
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProviders.map((provider) => (
                  <tr key={provider.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {provider.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {provider.base_url}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        provider.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {provider.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {provider.ai_models?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingProvider(provider)
                          setShowProviderForm(true)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteProvider(provider.id)}
                        disabled={isLoading}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Models Tab */}
      {activeTab === 'models' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">AI Models</h2>
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

          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Context Window
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Features
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProviders.flatMap(provider =>
                  provider.ai_models?.map(model => (
                    <tr key={model.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{model.display_name}</div>
                        <div className="text-sm text-gray-500">{model.model_identifier}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {provider.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {model.context_window_tokens?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-1">
                          {model.supports_vision && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Vision
                            </span>
                          )}
                          {model.supports_tools && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Tools
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          model.is_enabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {model.is_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingModel(model)
                            setShowModelForm(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteModel(model.id)}
                          disabled={isLoading}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  )) || []
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Endpoints Tab */}
      {activeTab === 'endpoints' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">AI Endpoints</h2>
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

          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    API Path
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Temperature
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentEndpoints.map((endpoint) => (
                  <tr key={endpoint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {endpoint.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {endpoint.ai_models?.display_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {endpoint.ai_models?.ai_providers?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {endpoint.api_path}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {endpoint.http_method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {endpoint.default_temperature || 'Default'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        endpoint.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {endpoint.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingEndpoint(endpoint)
                          setShowEndpointForm(true)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteEndpoint(endpoint.id)}
                        disabled={isLoading}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provider Form Modal */}
      {showProviderForm && (
        <ProviderForm
          provider={editingProvider}
          onSubmit={handleProviderSubmit}
          onCancel={() => {
            setShowProviderForm(false)
            setEditingProvider(null)
          }}
          isLoading={isLoading}
        />
      )}

      {/* Model Form Modal */}
      {showModelForm && (
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
      )}

      {/* Endpoint Form Modal */}
      {showEndpointForm && (
        <EndpointForm
          endpoint={editingEndpoint}
          providers={currentProviders}
          onSubmit={handleEndpointSubmit}
          onCancel={() => {
            setShowEndpointForm(false)
            setEditingEndpoint(null)
          }}
          isLoading={isLoading}
        />
      )}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium mb-4">
          {provider ? 'Edit Provider' : 'Add Provider'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
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

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (provider ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </div>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium mb-4">
          {model ? 'Edit Model' : 'Add Model'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider
            </label>
            <select
              value={formData.provider_id}
              onChange={(e) => setFormData(prev => ({ ...prev, provider_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="supports_vision"
                checked={formData.supports_vision}
                onChange={(e) => setFormData(prev => ({ ...prev, supports_vision: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="supports_vision" className="text-sm font-medium text-gray-700">
                Supports Vision
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="supports_tools"
                checked={formData.supports_tools}
                onChange={(e) => setFormData(prev => ({ ...prev, supports_tools: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="supports_tools" className="text-sm font-medium text-gray-700">
                Supports Tools
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_enabled"
                checked={formData.is_enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, is_enabled: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="is_enabled" className="text-sm font-medium text-gray-700">
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

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (model ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Endpoint Form Component
function EndpointForm({
  endpoint,
  providers,
  onSubmit,
  onCancel,
  isLoading
}: {
  endpoint: Endpoint | null
  providers: Provider[]
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

  const availableModels = providers.flatMap(p => p.ai_models || [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium mb-4">
          {endpoint ? 'Edit Endpoint' : 'Add Endpoint'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Slug"
            value={formData.slug}
            onChange={(value) => setFormData(prev => ({ ...prev, slug: value }))}
            required
            placeholder="e.g. chat_completion"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <select
              value={formData.model_id}
              onChange={(e) => setFormData(prev => ({ ...prev, model_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a model...</option>
              {availableModels.map(model => {
                const provider = providers.find(p => p.id === model.provider_id)
                return (
                  <option key={model.id} value={model.id}>
                    {model.display_name} ({provider?.name})
                  </option>
                )
              })}
            </select>
          </div>

          <Input
            label="API Path"
            value={formData.api_path}
            onChange={(value) => setFormData(prev => ({ ...prev, api_path: value }))}
            required
            placeholder="e.g. /chat/completions"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HTTP Method
            </label>
            <select
              value={formData.http_method}
              onChange={(e) => setFormData(prev => ({ ...prev, http_method: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="supports_streaming"
                checked={formData.supports_streaming}
                onChange={(e) => setFormData(prev => ({ ...prev, supports_streaming: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="supports_streaming" className="text-sm font-medium text-gray-700">
                Supports Streaming
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
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

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (endpoint ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}