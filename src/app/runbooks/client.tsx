'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, Input, Textarea, ExpandableTable, Drawer, PillList, Select, type TableColumn, type SelectOption } from '@/components/interaction'
import { Plus, Pencil, Trash2, Copy, CircleDot } from 'lucide-react'
import { formatHumanReadableDate } from '@/utils/time'
import styles from './client.module.css'

interface RunbookStep {
  id: string
  runbook_id: string
  step_type: 'ai_operation' | 'endpoint_call' | 'telegram_message'
  prompt_template_id: string | null
  endpoint_id: string | null
  step_order: number
  step_name: string
  description: string | null
  timeout_seconds: number
  retry_count: number
  retry_delay_seconds: number
  // Telegram message configuration
  user_telegram_chat_id: string | null
  // Simple endpoint configuration (base method and URL)
  http_method: string | null
  endpoint_url: string | null
  // Advanced endpoint configuration (enhancements like headers, body templates, response mapping)
  endpoint_config: any | null
  // Tool configuration for AI operations
  enabled_tools: Record<string, boolean> | null
  created_at: string
  updated_at: string
}

interface Runbook {
  id: string
  name: string
  description: string | null
  is_active: boolean
  max_execution_time_minutes: number
  on_error_behavior: 'stop' | 'continue'
  created_at: string
  updated_at: string
  steps: number
}

interface RunbookTemplate {
  id: string
  name: string
}

interface RunbookOperationParam {
  name: string
  in: 'body' | 'query' | 'path' | 'header'
  required: boolean
  type: string
}

interface RunbookOperation {
  id: string
  path: string
  method: string
  description: string
  requestParams?: RunbookOperationParam[]
  auth?: {
    required: boolean
    mechanisms: string[]
  }
}

interface RunbookEndpoint {
  id: string
  slug: string
  ai_models?: { display_name: string, ai_providers?: { name: string } }
}

interface TelegramChat {
  id: string
  chat_id: string
  chat_title: string | null
  is_default: boolean
}

interface RunbookStepsContentProps {
  runbook: Runbook
  availableTemplates: RunbookTemplate[]
  availableEndpoints: RunbookEndpoint[]
  availableTelegramChats: TelegramChat[]
  onEditStep: (step: RunbookStep, runbook: Runbook) => void
  onDeleteStep: (step: RunbookStep, runbook: Runbook) => void
}

const RunbookStepsContent: React.FC<RunbookStepsContentProps> = ({
  runbook,
  availableTemplates,
  availableEndpoints,
  availableTelegramChats,
  onEditStep,
  onDeleteStep
}) => {
  const [steps, setSteps] = useState<RunbookStep[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const getStepTypeLabel = (stepType: RunbookStep['step_type']) => {
    if (stepType === 'ai_operation') {
      return 'AI Operation'
    }
    if (stepType === 'endpoint_call') {
      return 'Endpoint Call'
    }
    return 'Telegram Message'
  }

  const getTemplateName = (templateId: string | null) => {
    if (!templateId) return '—'
    const template = availableTemplates.find((candidate) => candidate.id === templateId)
    return template?.name || templateId
  }

  const getEndpointLabel = (endpointId: string | null) => {
    if (!endpointId) return '—'
    const endpoint = availableEndpoints.find((candidate) => candidate.id === endpointId)
    return endpoint?.slug || endpointId
  }

  const getTelegramChatLabel = (chatId: string | null) => {
    if (!chatId) return '—'
    const chat = availableTelegramChats.find((candidate) => candidate.id === chatId)
    if (!chat) return chatId

    if (chat.chat_title) {
      return `${chat.chat_title} (${chat.chat_id})`
    }

    return `${chat.chat_id}${chat.is_default ? ' (Default)' : ''}`
  }

  const getStepDetails = (step: RunbookStep) => {
    if (step.step_type === 'ai_operation') {
      return [
        { label: 'Operation', value: getTemplateName(step.prompt_template_id) },
        { label: 'Endpoint', value: getEndpointLabel(step.endpoint_id) }
      ]
    }

    if (step.step_type === 'endpoint_call') {
      return [
        { label: 'HTTP Method', value: step.http_method || '—' },
        { label: 'Endpoint', value: step.endpoint_url || '—' }
      ]
    }

    return [
      { label: 'Telegram Chat', value: getTelegramChatLabel(step.user_telegram_chat_id) }
    ]
  }

  useEffect(() => {
    const loadSteps = async () => {
      try {
        const stepsResponse = await fetch(`/api/runbooks/${runbook.id}`)
        if (stepsResponse.ok) {
          const runbookData = await stepsResponse.json()
          setSteps(runbookData.steps || [])
        }
      } catch (error) {
        console.error('Error loading steps:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSteps()
  }, [runbook.id])

  if (isLoading) {
    return <div style={{ padding: '1rem' }}>Loading steps...</div>
  }

  return (
    <div style={{ padding: '0.5rem 0' }}>
      <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
        Steps ({steps.length})
      </h4>
      {steps.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          No steps defined yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {steps
            .sort((a, b) => a.step_order - b.step_order)
            .map((step) => {
              const stepDetails = getStepDetails(step)
              return (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  backgroundColor: '#222834',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {step.step_order}
                </div>
                <div className={styles.stepCard}>
                  <div className={styles.stepGrid}>
                    <div className={styles.stepGridCell}>
                      <div className={styles.stepGridLabel}>Step</div>
                      <div className={styles.stepGridTitle}>{step.step_name}</div>
                      {step.description && (
                        <div className={styles.stepGridDescription}>
                          {step.description}
                        </div>
                      )}
                    </div>
                    <div className={styles.stepGridCell}>
                      <div className={styles.stepGridLabel}>Type</div>
                      <div className={styles.stepGridValue}>{getStepTypeLabel(step.step_type)}</div>
                    </div>
                    <div className={styles.stepGridCell}>
                      <div className={styles.stepGridLabel}>Details</div>
                      <div className={styles.stepDetails}>
                        {stepDetails.map((detail, detailIndex) => (
                          <div className={styles.stepDetailRow} key={`${step.id}-${detailIndex}`}>
                            <span className={styles.stepDetailLabel}>{detail.label}:</span>
                            <span className={styles.stepDetailValue}>{detail.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={styles.stepGridCell}>
                      <div className={styles.stepGridLabel}>Actions</div>
                      <div className={styles.stepGridActionButtons}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditStep(step, runbook)}
                          aria-label={`Edit step ${step.step_name}`}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteStep(step, runbook)}
                          aria-label={`Delete step ${step.step_name}`}
                          className={`${styles.buttonDanger} ${styles.stepDeleteButton}`}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )})}
        </div>
      )}
    </div>
  )
}

const DeleteConfirmationModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
}> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
          {title}
        </h3>
        <p style={{ margin: '0 0 2rem 0', color: '#6b7280' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm} className={styles.buttonDanger}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

export const RunbooksClient: React.FC = () => {
  const [runbooks, setRunbooks] = useState<Runbook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingRunbook, setEditingRunbook] = useState<Runbook | null>(null)
  const [isStepDrawerOpen, setIsStepDrawerOpen] = useState(false)
  const [editingStep, setEditingStep] = useState<RunbookStep | null>(null)
  const [currentRunbook, setCurrentRunbook] = useState<Runbook | null>(null)
  const [availableTemplates, setAvailableTemplates] = useState<RunbookTemplate[]>([])
  const [availableEndpoints, setAvailableEndpoints] = useState<RunbookEndpoint[]>([])
  const [availableTelegramChats, setAvailableTelegramChats] = useState<TelegramChat[]>([])
  const [availableTools, setAvailableTools] = useState<Array<{id: string, name: string, description: string}>>([])
  const [availableOperations, setAvailableOperations] = useState<RunbookOperation[]>([])
  const [isOperationsLoading, setIsOperationsLoading] = useState(false)
  const [stepFormData, setStepFormData] = useState({
    step_name: '',
    description: '',
    step_type: 'ai_operation' as 'ai_operation' | 'endpoint_call' | 'telegram_message',
    prompt_template_id: '',
    endpoint_id: '',
    timeout_seconds: 300,
    retry_count: 0,
    retry_delay_seconds: 5,
    // Telegram message configuration
    user_telegram_chat_id: '',
    // Simple endpoint configuration (base method and URL)
    http_method: '',
    endpoint_url: '',
    // Advanced endpoint configuration (enhancements like headers, body templates, response mapping)
    endpoint_config: null as any,
    // Tool configuration for AI operations
    enabled_tools: {} as Record<string, boolean>
  })
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    max_execution_time_minutes: 30,
    on_error_behavior: 'stop' as 'stop' | 'continue'
  })
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    type: 'runbook' | 'step'
    item: Runbook | RunbookStep | null
    runbook?: Runbook
  }>({
    isOpen: false,
    type: 'runbook',
    item: null
  })

  const fetchRunbooks = useCallback(async () => {
    try {
      const response = await fetch('/api/runbooks')
      if (response.ok) {
        const data = await response.json()
        setRunbooks(data)
      }
    } catch {
      console.error('Error fetching runbooks')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchAvailableTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/prompt-templates')
      if (response.ok) {
        const templates = await response.json()
        setAvailableTemplates(templates.map((t: any) => ({ id: t.id, name: t.name })))
      } else {
        // Mock data for testing
        console.log('Using mock template data due to auth issue')
        setAvailableTemplates([
          { id: 'template-1', name: 'Basic QA Template' },
          { id: 'template-2', name: 'Code Analysis Template' },
          { id: 'template-3', name: 'Summarization Template' }
        ])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      // Mock data for testing
      setAvailableTemplates([
        { id: 'template-1', name: 'Basic QA Template' },
        { id: 'template-2', name: 'Code Analysis Template' },
        { id: 'template-3', name: 'Summarization Template' }
      ])
    }
  }, [])

  const fetchAvailableEndpoints = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-endpoints')
      if (response.ok) {
        const { endpoints } = await response.json()
        setAvailableEndpoints(endpoints.map((e: any) => ({
          id: e.id,
          slug: e.slug,
          ai_models: e.ai_models
        })))
      } else {
        // Mock data for testing
        console.log('Using mock endpoint data due to auth issue')
        setAvailableEndpoints([
          {
            id: 'endpoint-1',
            slug: 'gpt-4-turbo',
            ai_models: { display_name: 'GPT-4 Turbo', ai_providers: { name: 'OpenAI' } }
          },
          {
            id: 'endpoint-2',
            slug: 'claude-3-sonnet',
            ai_models: { display_name: 'Claude 3 Sonnet', ai_providers: { name: 'Anthropic' } }
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching endpoints:', error)
      // Mock data for testing
      setAvailableEndpoints([
        {
          id: 'endpoint-1',
          slug: 'gpt-4-turbo',
          ai_models: { display_name: 'GPT-4 Turbo', ai_providers: { name: 'OpenAI' } }
        },
        {
          id: 'endpoint-2',
          slug: 'claude-3-sonnet',
          ai_models: { display_name: 'Claude 3 Sonnet', ai_providers: { name: 'Anthropic' } }
        }
      ])
    }
  }, [])

  const fetchAvailableTelegramChats = useCallback(async () => {
    try {
      const response = await fetch('/api/integrations/telegram/chats')
      if (response.ok) {
        const chats = await response.json()
        setAvailableTelegramChats(chats)
      } else {
        console.log('No telegram chats available or API error')
        setAvailableTelegramChats([])
      }
    } catch (error) {
      console.error('Error fetching telegram chats:', error)
      setAvailableTelegramChats([])
    }
  }, [])

  const fetchAvailableTools = useCallback(async (endpointId: string) => {
    if (!endpointId) {
      setAvailableTools([])
      return
    }

    try {
      const response = await fetch(`/api/ai-endpoints/${endpointId}/tools`)
      if (response.ok) {
        const { supports_tools, supported_tools } = await response.json()
        if (supports_tools && supported_tools) {
          // Convert tool names to a more user-friendly format
          const tools = supported_tools.map((toolName: string) => ({
            id: toolName,
            name: toolName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: getToolDescription(toolName)
          }))
          setAvailableTools(tools)
        } else {
          setAvailableTools([])
        }
      } else {
        console.log('No tools available or API error')
        setAvailableTools([])
      }
    } catch (error) {
      console.error('Error fetching available tools:', error)
      setAvailableTools([])
    }
  }, [])

  const fetchAvailableOperations = useCallback(async () => {
    try {
      setIsOperationsLoading(true)
      const response = await fetch('/api/operations')
      if (response.ok) {
        const { operations } = await response.json()
        const parsedOperations = Array.isArray(operations)
          ? operations
              .map((operation: any) => ({
                id: operation?.id || `${operation?.method || 'GET'}:${operation?.path || ''}`,
                path: operation?.path || '',
                method: String(operation?.method || '').toUpperCase(),
                description: operation?.description || '',
                requestParams: operation?.requestParams || [],
                auth: operation?.auth
              }))
              .filter((operation: RunbookOperation) => operation.path && operation.method)
          : []

        setAvailableOperations(parsedOperations)
      } else {
        setAvailableOperations([])
      }
    } catch (error) {
      console.error('Error fetching operations:', error)
      setAvailableOperations([])
    } finally {
      setIsOperationsLoading(false)
    }
  }, [])

  const getToolDescription = (toolName: string): string => {
    const descriptions: Record<string, string> = {
      web_search: 'Search the web for current information and facts',
      x_search: 'Search X (formerly Twitter) for recent posts and trends'
    }
    return descriptions[toolName] || `${toolName} tool`
  }

  useEffect(() => {
    fetchRunbooks()
    fetchAvailableTemplates()
    fetchAvailableEndpoints()
    fetchAvailableTelegramChats()
    fetchAvailableOperations()
  }, [fetchRunbooks, fetchAvailableTemplates, fetchAvailableEndpoints, fetchAvailableTelegramChats, fetchAvailableOperations])

  const getOperationPillId = (operation: RunbookOperation) => `${operation.method.toUpperCase()}|${operation.path}`

  const parseOperationPillId = (pillId: string) => {
    const [method, ...pathParts] = pillId.split('|')
    return {
      method,
      path: pathParts.join('|')
    }
  }

  const endpointOperationOptions = availableOperations.map((operation) => ({
    id: getOperationPillId(operation),
    label: `${operation.method} ${operation.path}`
  }))

  const selectedOperationForStep = availableOperations.find((operation) => {
    return (
      operation.path === stepFormData.endpoint_url &&
      operation.method.toUpperCase() === stepFormData.http_method.toUpperCase()
    )
  })

  const selectedOperationPillId = selectedOperationForStep ? getOperationPillId(selectedOperationForStep) : ''

  // Fetch available tools when endpoint changes
  useEffect(() => {
    if (stepFormData.endpoint_id && isStepDrawerOpen) {
      fetchAvailableTools(stepFormData.endpoint_id)
    }
  }, [stepFormData.endpoint_id, isStepDrawerOpen, fetchAvailableTools])

  const handleCreateRunbook = () => {
    setEditingRunbook(null)
    setFormData({
      name: '',
      description: '',
      is_active: true,
      max_execution_time_minutes: 30,
      on_error_behavior: 'stop'
    })
    setIsDrawerOpen(true)
  }

  const handleEditRunbook = (runbook: Runbook) => {
    setEditingRunbook(runbook)
    setFormData({
      name: runbook.name,
      description: runbook.description || '',
      is_active: runbook.is_active,
      max_execution_time_minutes: runbook.max_execution_time_minutes,
      on_error_behavior: runbook.on_error_behavior
    })
    setIsDrawerOpen(true)
  }

  const handleDuplicateRunbook = async (runbook: Runbook) => {
    try {
      const response = await fetch('/api/runbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${runbook.name} (Copy)`,
          description: runbook.description,
          is_active: false,
          max_execution_time_minutes: runbook.max_execution_time_minutes,
          on_error_behavior: runbook.on_error_behavior
        })
      })

      if (response.ok) {
        fetchRunbooks()
      }
    } catch (error) {
      console.error('Error duplicating runbook:', error)
    }
  }

  const handleSaveRunbook = async () => {
    try {
      const method = editingRunbook ? 'PUT' : 'POST'
      const url = editingRunbook
        ? `/api/runbooks/${editingRunbook.id}`
        : '/api/runbooks'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsDrawerOpen(false)
        fetchRunbooks()
      } else {
        const errorData = await response.json()
        alert(`Error saving runbook: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving runbook:', error)
      alert('Error saving runbook. Please try again.')
    }
  }

  const handleDeleteRunbook = (runbook: Runbook) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'runbook',
      item: runbook
    })
  }

  const confirmDelete = async () => {
    if (!deleteConfirmation.item) return

    try {
      if (deleteConfirmation.type === 'runbook') {
        const response = await fetch(`/api/runbooks/${deleteConfirmation.item.id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          fetchRunbooks()
        } else {
          console.error('Failed to delete runbook:', response.status)
        }
      } else if (deleteConfirmation.type === 'step') {
        const step = deleteConfirmation.item as RunbookStep
        const runbook = deleteConfirmation.runbook!
        const response = await fetch(`/api/runbooks/${runbook.id}/steps/${step.id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          fetchRunbooks() // Refresh runbook list to update step count
        } else {
          console.error('Failed to delete step:', response.status)
        }
      }
    } catch (error) {
      console.error('Error deleting:', error)
    } finally {
      setDeleteConfirmation({ isOpen: false, type: 'runbook', item: null })
    }
  }


  const handleCreateStepForRunbook = async (runbook: Runbook) => {
    setCurrentRunbook(runbook)
    setEditingStep(null)
    setStepFormData({
      step_name: '',
      description: '',
      step_type: 'ai_operation',
      prompt_template_id: '',
      endpoint_id: '',
      timeout_seconds: 300,
      retry_count: 0,
      retry_delay_seconds: 5,
      // Telegram message configuration
      user_telegram_chat_id: '',
      // Simple endpoint configuration (base method and URL)
      http_method: '',
      endpoint_url: '',
      // Advanced endpoint configuration (enhancements like headers, body templates, response mapping)
      endpoint_config: null,
      // Tool configuration for AI operations
      enabled_tools: {}
    })

    setIsStepDrawerOpen(true)
  }


  const handleEditStep = async (step: RunbookStep, runbook: Runbook) => {
    setCurrentRunbook(runbook)
    setEditingStep(step)
    setStepFormData({
      step_name: step.step_name,
      description: step.description || '',
      step_type: step.step_type,
      prompt_template_id: step.prompt_template_id || '',
      endpoint_id: step.endpoint_id || '',
      timeout_seconds: step.timeout_seconds,
      retry_count: step.retry_count,
      retry_delay_seconds: step.retry_delay_seconds,
      // Telegram message configuration
      user_telegram_chat_id: step.user_telegram_chat_id || '',
      // Simple endpoint configuration (base method and URL)
      http_method: step.http_method || '',
      endpoint_url: step.endpoint_url || '',
      // Advanced endpoint configuration (enhancements like headers, body templates, response mapping)
      endpoint_config: step.endpoint_config,
      // Tool configuration for AI operations
      enabled_tools: step.enabled_tools || {}
    })

    setIsStepDrawerOpen(true)
  }

  const handleSaveStep = async () => {
    if (!currentRunbook) return

    // Client-side validation
    if (!stepFormData.step_name.trim()) {
      alert('Step name is required')
      return
    }

    if (stepFormData.step_type === 'ai_operation') {
      if (!stepFormData.prompt_template_id.trim()) {
        alert('Prompt template is required for AI operation steps')
        return
      }
      if (!stepFormData.endpoint_id.trim()) {
        alert('Endpoint is required for AI operation steps')
        return
      }
    } else if (stepFormData.step_type === 'endpoint_call') {
      const hasSimpleConfig = stepFormData.http_method.trim() && stepFormData.endpoint_url.trim()
      const hasAdvancedConfig = stepFormData.endpoint_config

      if (!hasSimpleConfig && !hasAdvancedConfig) {
        alert('HTTP method and endpoint URL are required for endpoint call steps, or use advanced configuration')
        return
      }
    } else if (stepFormData.step_type === 'telegram_message') {
      if (!stepFormData.user_telegram_chat_id.trim()) {
        alert('Telegram chat is required for telegram message steps')
        return
      }
    }

    try {
      const method = editingStep ? 'PUT' : 'POST'
      const url = editingStep
        ? `/api/runbooks/${currentRunbook.id}/steps/${editingStep.id}`
        : `/api/runbooks/${currentRunbook.id}/steps`

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepFormData)
      })

      if (response.ok) {
        setIsStepDrawerOpen(false)
        fetchRunbooks() // Refresh runbook list to update step count
      } else {
        const errorData = await response.json()
        alert(`Error saving step: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving step:', error)
      alert('Error saving step. Please try again.')
    }
  }

  const handleDeleteStep = (step: RunbookStep, runbook: Runbook) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'step',
      item: step,
      runbook: runbook
    })
  }

  const columns: TableColumn<Runbook>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (runbook) => (
        <div>
          <div className={styles.runbookName}>
            {runbook.name}
            {!runbook.is_active && (
              <span className={styles.inactiveBadge} title="Inactive runbook">
                ⚪
              </span>
            )}
          </div>
          {runbook.description && (
            <div className={styles.runbookDescription}>{runbook.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'steps',
      header: 'Steps',
      render: (runbook) => (
        <span className={styles.stepCount}>
          {runbook.steps}
        </span>
      )
    },
    {
      key: 'max_execution_time_minutes',
      header: 'Max Time',
      render: (runbook) => `${runbook.max_execution_time_minutes}min`
    },
    {
      key: 'on_error_behavior',
      header: 'On Error',
      render: (runbook) => (
        <span className={`${styles.behaviorBadge} ${runbook.on_error_behavior === 'stop' ? styles.stopBadge : styles.continueBadge}`}>
          {runbook.on_error_behavior}
        </span>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (runbook) => formatHumanReadableDate(runbook.created_at)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (runbook) => (
        <div className={styles.runbookActions}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleCreateStepForRunbook(runbook)}
            aria-label="Add step"
          >
            <CircleDot size={16} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditRunbook(runbook)}
            aria-label="Edit runbook"
          >
            <Pencil size={16} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDuplicateRunbook(runbook)}
            aria-label="Duplicate runbook"
          >
            <Copy size={16} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteRunbook(runbook)}
            aria-label="Delete runbook"
            className={styles.buttonDanger}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      )
    }
  ]

  if (isLoading) {
    return <div>Loading runbooks...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Your Runbooks
          </h2>
          <p style={{ color: '#6b7280' }}>
            Manage linear AI workflow runbooks for sequential prompt execution.
          </p>
        </div>
        <Button onClick={handleCreateRunbook}>
          <Plus size={16} style={{ marginRight: '8px' }} />
          Create Runbook
        </Button>
      </div>

      <ExpandableTable
        data={runbooks}
        columns={columns}
        getRowKey={(runbook) => runbook.id}
        emptyMessage="No runbooks found. Create your first runbook to get started."
        expandableContent={(runbook) => (
          <RunbookStepsContent
            runbook={runbook}
            availableTemplates={availableTemplates}
            availableEndpoints={availableEndpoints}
            availableTelegramChats={availableTelegramChats}
            onEditStep={handleEditStep}
            onDeleteStep={handleDeleteStep}
          />
        )}
      />

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        position="right"
      >
        <div style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            {editingRunbook ? 'Edit Runbook' : 'Create Runbook'}
          </h3>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Runbook Name</label>
            <Input size="sm"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              placeholder="e.g., Blog Post Creation Workflow"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Description (Optional)</label>
            <Textarea size="sm"
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Brief description of what this runbook does"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Max Execution Time (minutes)</label>
            <Input size="sm"
              type="number"
              value={formData.max_execution_time_minutes.toString()}
              onChange={(value) => setFormData({ ...formData, max_execution_time_minutes: parseInt(value) || 30 })}
              placeholder="30"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>On Error</label>
            <PillList
              options={[
                { id: 'stop', label: 'Stop Execution' },
                { id: 'continue', label: 'Continue to Next Step' }
              ]}
              selected={[formData.on_error_behavior]}
              onChange={(selected) => setFormData({ ...formData, on_error_behavior: selected[0] as 'stop' | 'continue' })}
              variant="single"
              size="xs"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                style={{ marginRight: '8px' }}
              />
              Active Runbook
            </label>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
              Active runbooks can be executed. Inactive runbooks are kept for reference.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '2rem' }}>
            <Button size="sm" onClick={handleSaveRunbook}>
              {editingRunbook ? 'Update Runbook' : 'Create Runbook'}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>


      <Drawer
        isOpen={isStepDrawerOpen}
        onClose={() => setIsStepDrawerOpen(false)}
        position="right"
      >
        <div style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            {editingStep ? 'Edit Step' : 'Add Step'}
          </h3>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Step Name</label>
            <Input size="sm"
              value={stepFormData.step_name}
              onChange={(value) => setStepFormData({ ...stepFormData, step_name: value })}
              placeholder="e.g., Generate blog outline"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Description (Optional)</label>
            <Textarea size="sm"
              value={stepFormData.description}
              onChange={(value) => setStepFormData({ ...stepFormData, description: value })}
              placeholder="Brief description of what this step does"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Step Type</label>
            <PillList
              options={[
                { id: 'ai_operation', label: 'AI Operation' },
                { id: 'endpoint_call', label: 'Endpoint Call' },
                { id: 'telegram_message', label: 'Telegram Message' }
              ]}
              selected={[stepFormData.step_type]}
              onChange={(selected) => setStepFormData({
                ...stepFormData,
                step_type: selected[0] as 'ai_operation' | 'endpoint_call' | 'telegram_message'
              })}
              variant="single"
              size="xs"
            />
          </div>

          {stepFormData.step_type === 'ai_operation' && (
            <div className={styles.formField}>
              <Select size="sm"
                label="Prompt Template"
                value={stepFormData.prompt_template_id}
                onChange={(value) => setStepFormData({ ...stepFormData, prompt_template_id: value })}
                placeholder="Select a prompt template..."
                options={availableTemplates.map(template => ({
                  id: template.id,
                  label: template.name
                }))}
              />
          </div>
          )}

          {stepFormData.step_type === 'ai_operation' && (
          <div className={styles.formField}>
            <Select size="sm"
              label="Endpoint"
              value={stepFormData.endpoint_id}
              onChange={(value) => setStepFormData({ ...stepFormData, endpoint_id: value })}
              placeholder="Select an endpoint..."
              options={availableEndpoints.map(endpoint => ({
                id: endpoint.id,
                label: `${endpoint.slug} (${endpoint.ai_models?.display_name} - ${endpoint.ai_models?.ai_providers?.name})`
              }))}
            />
          </div>
          )}

          {stepFormData.step_type === 'ai_operation' && availableTools.length > 0 && (
            <div className={styles.formField}>
              <label className={styles.formLabel}>Enabled Tools</label>
              <div style={{ marginBottom: '0.5rem' }}>
                <PillList
                  options={availableTools.map(tool => ({
                    id: tool.id,
                    label: tool.name
                  }))}
                  selected={Object.keys(stepFormData.enabled_tools).filter(key => stepFormData.enabled_tools[key])}
                  onChange={(selected) => {
                    const newEnabledTools: Record<string, boolean> = {}
                    selected.forEach(toolId => {
                      newEnabledTools[toolId] = true
                    })
                    setStepFormData({ ...stepFormData, enabled_tools: newEnabledTools })
                  }}
                  variant="multiple"
                  size="xs"
                />
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                Select which tools the AI can use during this step. Only tools supported by the selected model are shown.
              </div>
              {availableTools.length > 0 && (
                <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Tool Descriptions:</div>
                  <div style={{ display: 'grid', gap: '4px' }}>
                    {availableTools.map((tool) => (
                      <div key={tool.id} style={{ fontSize: '11px', color: '#6b7280' }}>
                        <strong>{tool.name}:</strong> {tool.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {stepFormData.step_type === 'telegram_message' && (
            <div className={styles.formField}>
              <Select size="sm"
                label="Telegram Chat"
                value={stepFormData.user_telegram_chat_id}
                onChange={(value) => setStepFormData({ ...stepFormData, user_telegram_chat_id: value })}
                placeholder="Select a telegram chat..."
                options={availableTelegramChats.map(chat => ({
                  id: chat.id,
                  label: chat.chat_title ? `${chat.chat_title} (${chat.chat_id})` : chat.chat_id + (chat.is_default ? ' (Default)' : '')
                }))}
              />
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Select the Telegram chat where the message will be sent.
              </div>
            </div>
          )}

          {stepFormData.step_type === 'endpoint_call' && (
            <>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Choose from discovered operations</label>
                {isOperationsLoading ? (
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '0.5rem' }}>
                    Loading operations...
                  </div>
                ) : endpointOperationOptions.length > 0 ? (
                  <PillList
                    options={endpointOperationOptions}
                    selected={selectedOperationPillId ? [selectedOperationPillId] : []}
                    onChange={(selected) => {
                      if (!selected.length) {
                        setStepFormData({ ...stepFormData, http_method: '', endpoint_url: '' })
                        return
                      }

                      const mapped = parseOperationPillId(selected[0])
                      if (!mapped.path || !mapped.method) return
                      setStepFormData({ ...stepFormData, http_method: mapped.method, endpoint_url: mapped.path })
                    }}
                    variant="single"
                    size="xs"
                    maxVisibleItems={5}
                  />
                ) : (
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '0.5rem' }}>
                    No operation endpoints discovered yet.
                  </div>
                )}
              </div>

              <AnimatePresence>
                {selectedOperationForStep && (
                  <motion.div
                    key={selectedOperationForStep.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={styles.formField}
                  >
                    <label className={styles.formLabel}>Selected operation</label>
                    <div className={styles.operationInfoCard}>
                      <div className={styles.operationInfoGrid}>
                        <div className={styles.operationInfoItem}>
                          <span className={styles.operationInfoLabel}>Method</span>
                          <span className={styles.operationInfoValue}>{selectedOperationForStep.method}</span>
                        </div>
                        <div className={styles.operationInfoItem}>
                          <span className={styles.operationInfoLabel}>Path</span>
                          <span className={styles.operationInfoValue}>{selectedOperationForStep.path}</span>
                        </div>
                        <div className={styles.operationInfoItem}>
                          <span className={styles.operationInfoLabel}>Auth required</span>
                          <span className={styles.operationInfoValue}>
                            {selectedOperationForStep.auth?.required ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className={styles.operationInfoItem}>
                          <span className={styles.operationInfoLabel}>Auth mechanisms</span>
                          <span className={styles.operationInfoValue}>
                            {selectedOperationForStep.auth?.mechanisms?.join(', ') || 'N/A'}
                          </span>
                        </div>
                        <div className={`${styles.operationInfoItem} ${styles.operationInfoFullWidth}`}>
                          <span className={styles.operationInfoLabel}>Description</span>
                          <span className={styles.operationInfoValue}>
                            {selectedOperationForStep.description || 'No description provided.'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {selectedOperationForStep?.requestParams && selectedOperationForStep.requestParams.length > 0 && (
                  <motion.div
                    key={`${selectedOperationForStep.id}-params`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className={styles.formField}
                  >
                    <label className={styles.formLabel}>Known parameters</label>
                    <div className={styles.operationParamsGrid}>
                      {selectedOperationForStep.requestParams.map((param, index) => (
                        <motion.div
                          key={param.name}
                          className={styles.operationParamCard}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                        >
                          <div className={styles.operationParamName}>{param.name}</div>
                          <div className={styles.operationParamMeta}>
                            {param.in.toUpperCase()} • {param.type}{param.required ? ' • Required' : ' • Optional'}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={styles.formField}>
                <label className={styles.formLabel}>HTTP Method</label>
                <PillList
                  options={[
                    { id: 'GET', label: 'GET' },
                    { id: 'POST', label: 'POST' },
                    { id: 'PUT', label: 'PUT' },
                    { id: 'PATCH', label: 'PATCH' },
                    { id: 'DELETE', label: 'DELETE' },
                    { id: 'HEAD', label: 'HEAD' },
                    { id: 'OPTIONS', label: 'OPTIONS' }
                  ]}
                  selected={stepFormData.http_method ? [stepFormData.http_method] : []}
                  onChange={(selected) => setStepFormData({ ...stepFormData, http_method: selected[0] || '' })}
                  variant="single"
                  size="xs"
                  maxVisibleItems={2}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Endpoint URL</label>
                <Input size="sm"
                  value={stepFormData.endpoint_url}
                  onChange={(value) => setStepFormData({ ...stepFormData, endpoint_url: value })}
                  placeholder="https://api.example.com/endpoint"
                />
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  For POST/PUT/PATCH requests, the JSON output from the previous step will be sent as the request body.
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>
                  <input
                    type="checkbox"
                    checked={!!stepFormData.endpoint_config}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Enable advanced config with default structure
                        setStepFormData({
                          ...stepFormData,
                          endpoint_config: {
                            headers: { 'Content-Type': 'application/json' }
                          }
                        })
                      } else {
                        // Disable advanced config
                        setStepFormData({ ...stepFormData, endpoint_config: null })
                      }
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  Use Advanced Configuration
                </label>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Enable for custom headers, body templates, and response mapping. Advanced configuration enhances but does not override the method or URL.
                </div>
              </div>

              {stepFormData.endpoint_config && (
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Advanced Endpoint Configuration</label>
                  <Textarea size="sm"
                    value={stepFormData.endpoint_config ? JSON.stringify(stepFormData.endpoint_config, null, 2) : ''}
                    onChange={(value) => {
                      try {
                        const parsed = value ? JSON.parse(value) : null
                        setStepFormData({ ...stepFormData, endpoint_config: parsed })
                      } catch (e) {
                        // Invalid JSON, store as string for now
                        setStepFormData({ ...stepFormData, endpoint_config: value })
                      }
                    }}
                    placeholder={`{
  "method": "POST",
  "url": "https://api.example.com/endpoint",
  "headers": {"Content-Type": "application/json", "Authorization": "Bearer token"},
  "body_template": "{\\"input\\": \\"{{input}}\\", \\"custom_field\\": \\"value\\"}",
  "response_mapping": {
    "output_path": "$.data",
    "output_key": "result"
  }
}`}
                    className={styles.formTextarea}
                  />
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Advanced configuration for custom headers, body templates, and response mapping. Use {"{{input}}"} to reference step input.
                  </div>
                </div>
              )}
            </>
          )}


          <div className={styles.formField}>
            <label className={styles.formLabel}>Timeout (seconds)</label>
            <Input size="sm"
              type="number"
              value={stepFormData.timeout_seconds.toString()}
              onChange={(value) => setStepFormData({ ...stepFormData, timeout_seconds: parseInt(value) || 300 })}
              placeholder="300"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Retry Count</label>
            <Input size="sm"
              type="number"
              value={stepFormData.retry_count.toString()}
              onChange={(value) => setStepFormData({ ...stepFormData, retry_count: parseInt(value) || 0 })}
              placeholder="0"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Retry Delay (seconds)</label>
            <Input size="sm"
              type="number"
              value={stepFormData.retry_delay_seconds.toString()}
              onChange={(value) => setStepFormData({ ...stepFormData, retry_delay_seconds: parseInt(value) || 5 })}
              placeholder="5"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '2rem' }}>
            <Button size="sm" onClick={handleSaveStep}>
              {editingStep ? 'Update Step' : 'Add Step'}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setIsStepDrawerOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>

      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, type: 'runbook', item: null })}
        onConfirm={confirmDelete}
        title={deleteConfirmation.type === 'runbook' ? 'Delete Runbook' : 'Delete Step'}
        message={
          deleteConfirmation.type === 'runbook'
            ? `Are you sure you want to delete "${(deleteConfirmation.item as Runbook)?.name}"? This will also delete all associated steps.`
            : `Are you sure you want to delete "${(deleteConfirmation.item as RunbookStep)?.step_name}"?`
        }
      />
    </div>
  )
}