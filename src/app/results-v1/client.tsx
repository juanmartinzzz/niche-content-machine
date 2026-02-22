'use client'

import React, { useState, useEffect } from 'react'
import { Button, Input, PillList } from '@/components/interaction'
import { Play, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import styles from './client.module.css'

interface Endpoint {
  id: string
  slug: string
  description: string | null
  api_path: string
  http_method: string
  default_temperature: number | null
  default_max_tokens: number | null
  default_top_p: number | null
  supports_streaming: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  ai_models: {
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
    ai_providers: {
      id: string
      name: string
      base_url: string
      is_active: boolean
      global_timeout_seconds: number | null
      max_retries: number | null
      notes: string | null
      created_at: string
      updated_at: string
    }
  }
}

interface PromptTemplate {
  id: string
  name: string
  description: string | null
  user_prompt_template: string
  system_prompt: string | null
  use_structured_output: boolean
  structured_output_schema: Record<string, unknown> | null
  structured_output_format: string | null
}

interface GenerateResponse {
  response: Record<string, unknown>
  endpoint: {
    id: string
    slug: string
    model: string
    provider: string
  }
  prompt_template: {
    id: string
    name: string
    version: number
  }
}

export const ResultsV1Client: React.FC = () => {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([])
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Fetch endpoints and prompt templates on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [endpointsRes, templatesRes] = await Promise.all([
          fetch('/api/ai-endpoints'),
          fetch('/api/prompt-templates')
        ])

        if (endpointsRes.ok) {
          const endpointsData = await endpointsRes.json()
          // Filter out endpoints that don't have valid model data
          const validEndpoints = (endpointsData.endpoints || []).filter((endpoint: any) => endpoint.ai_models)
          setEndpoints(validEndpoints)
        }

        if (templatesRes.ok) {
          const templatesData = await templatesRes.json()
          setPromptTemplates(templatesData)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load endpoints and templates')
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [])

  // Extract variables from selected template
  const currentTemplate = promptTemplates.find(t => t.id === selectedTemplate)
  const templateVariables = React.useMemo(() => {
    if (!currentTemplate) return []

    const regex = /\{\{(\w+)\}\}/g
    const matches = []
    let match
    const combinedText = (currentTemplate.system_prompt || '') + currentTemplate.user_prompt_template

    while ((match = regex.exec(combinedText)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1])
      }
    }

    return matches
  }, [currentTemplate])

  // Reset variables when template changes
  useEffect(() => {
    const newVariables: Record<string, string> = {}
    templateVariables.forEach(varName => {
      newVariables[varName] = ''
    })
    setVariables(newVariables)
  }, [selectedTemplate, templateVariables])

  const handleVariableChange = (varName: string, value: string) => {
    setVariables(prev => ({ ...prev, [varName]: value }))
  }

  const handleGenerate = async () => {
    if (!selectedEndpoint || !selectedTemplate) {
      setError('Please select both an endpoint and a prompt template')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint_id: selectedEndpoint,
          prompt_template_id: selectedTemplate,
          variables
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate response')
      }

      const data: GenerateResponse = await response.json()
      setResult(data)
    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className={styles.loading}>
        <Loader2 className={styles.spinner} size={24} />
        <p>Loading endpoints and templates...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Controls Section */}
      <div className={styles.controlsCard}>
        <h3>Test Configuration</h3>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>Endpoint</label>
            <PillList
              options={[
                ...(endpoints.length === 0 ? [{
                  id: '',
                  label: 'No endpoints available - create some in LLM Models Config'
                }] : []),
                ...endpoints.map(endpoint => ({
                  id: endpoint.id,
                  label: `${endpoint.slug} - ${endpoint.ai_models?.display_name || 'Unknown Model'} (${endpoint.ai_models?.ai_providers?.name || 'Unknown Provider'})`
                }))
              ]}
              selected={selectedEndpoint ? [selectedEndpoint] : []}
              onChange={(selected) => setSelectedEndpoint(selected[0] || '')}
              size="xs"
              variant="single"
            />
          </div>

          <div className={styles.formField}>
            <label>Prompt Template</label>
            <PillList
              options={promptTemplates.map(template => ({
                id: template.id,
                label: template.description ? `${template.name} - ${template.description}` : template.name
              }))}
              selected={selectedTemplate ? [selectedTemplate] : []}
              onChange={(selected) => setSelectedTemplate(selected[0] || '')}
              size="xs"
              variant="single"
            />
          </div>
        </div>

        {/* Variables Section */}
        {templateVariables.length > 0 && (
          <div className={styles.variablesSection}>
            <h4>Template Variables</h4>
            <div className={styles.variablesGrid}>
              {templateVariables.map(varName => (
                <div key={varName} className={styles.variableField}>
                  <Input
                    label={varName}
                    type="text"
                    value={variables[varName] || ''}
                    onChange={(value) => handleVariableChange(varName, value)}
                    placeholder={`Enter ${varName}...`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Template Preview */}
        {currentTemplate && (
          <div className={styles.templatePreview}>
            <h4>Prompt Preview</h4>
            {currentTemplate.system_prompt && (
              <div className={styles.promptSection}>
                <strong>System:</strong>
                <pre className={styles.promptText}>
                  {currentTemplate.system_prompt.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
                    return variables[varName] ? `<${variables[varName]}>` : match
                  })}
                </pre>
              </div>
            )}
            <div className={styles.promptSection}>
              <strong>User:</strong>
              <pre className={styles.promptText}>
                {currentTemplate.user_prompt_template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
                  return variables[varName] ? `<${variables[varName]}>` : match
                })}
              </pre>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <Button
            onClick={handleGenerate}
            disabled={isLoading || !selectedEndpoint || !selectedTemplate}
            className={styles.generateButton}
          >
            {isLoading ? (
              <>
                <Loader2 className={styles.spinner} size={16} />
                Generating...
              </>
            ) : (
              <>
                <Play size={16} />
                Generate Response
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className={`${styles.resultCard} ${styles.errorCard}`}>
          <div className={styles.resultHeader}>
            <AlertCircle size={20} color="#ef4444" />
            <h3>Error</h3>
          </div>
          <pre className={styles.errorText}>{error}</pre>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className={`${styles.resultCard} ${styles.successCard}`}>
          <div className={styles.resultHeader}>
            <CheckCircle size={20} color="#22c55e" />
            <h3>API Response</h3>
          </div>

          <div className={styles.resultMeta}>
            <div className={styles.metaItem}>
              <strong>Endpoint:</strong> {result.endpoint.slug}
            </div>
            <div className={styles.metaItem}>
              <strong>Model:</strong> {result.endpoint.model}
            </div>
            <div className={styles.metaItem}>
              <strong>Provider:</strong> {result.endpoint.provider}
            </div>
            <div className={styles.metaItem}>
              <strong>Template:</strong> {result.prompt_template.name} (v{result.prompt_template.version})
            </div>
          </div>

          <div className={styles.responseContent}>
            <h4>Raw API Response</h4>
            <pre className={styles.responseJson}>
              {JSON.stringify(result.response, null, 2)}
            </pre>
          </div>

          {/* Extract content if it's a standard chat completion response */}
          {result.response.choices?.[0]?.message?.content && (
            <div className={styles.responseContent}>
              <h4>Generated Content</h4>
              <div className={styles.generatedText}>
                {result.response.choices[0].message.content}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}