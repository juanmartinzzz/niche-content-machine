'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button, Input, Textarea, ExpandableTable, Drawer, PillList, Pill, type TableColumn } from '@/components/interaction'
import { Plus, Pencil, Trash2, Copy, CircleDot } from 'lucide-react'
import { formatHumanReadableDate } from '@/utils/time'
import styles from './client.module.css'

interface RunbookStep {
  id: string
  runbook_id: string
  step_type: 'ai_operation' | 'endpoint_call'
  prompt_template_id: string | null
  endpoint_id: string | null
  step_order: number
  step_name: string
  description: string | null
  input_from_step_id: string | null
  timeout_seconds: number
  retry_count: number
  retry_delay_seconds: number
  endpoint_config: any | null
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

interface RunbookStepsContentProps {
  runbook: Runbook
  availableTemplates: Array<{id: string, name: string}>
  onEditStep: (step: RunbookStep, runbook: Runbook) => void
  onDeleteStep: (step: RunbookStep, runbook: Runbook) => void
}

const RunbookStepsContent: React.FC<RunbookStepsContentProps> = ({
  runbook,
  availableTemplates,
  onEditStep,
  onDeleteStep
}) => {
  const [steps, setSteps] = useState<RunbookStep[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
        Steps ({steps.length})
      </h4>
      {steps.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          No steps defined yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {steps
            .sort((a, b) => a.step_order - b.step_order)
            .map((step) => (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Pill
                  label={`Step ${step.step_order}: ${step.step_name} (${step.step_type === 'ai_operation' ? 'AI' : 'HTTP'})`}
                  size="sm"
                  onClick={() => onEditStep(step, runbook)}
                />
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
            ))}
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
  const [availableStepsForInput, setAvailableStepsForInput] = useState<RunbookStep[]>([])
  const [availableTemplates, setAvailableTemplates] = useState<Array<{id: string, name: string}>>([])
  const [availableEndpoints, setAvailableEndpoints] = useState<Array<{id: string, slug: string, ai_models?: {display_name: string, ai_providers?: {name: string}}}>>([])
  const [stepFormData, setStepFormData] = useState({
    step_name: '',
    description: '',
    step_type: 'ai_operation' as 'ai_operation' | 'endpoint_call',
    prompt_template_id: '',
    endpoint_id: '',
    input_from_step_id: '',
    timeout_seconds: 300,
    retry_count: 0,
    retry_delay_seconds: 5,
    endpoint_config: null as any
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
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
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
      }
    } catch (error) {
      console.error('Error fetching endpoints:', error)
    }
  }, [])

  useEffect(() => {
    fetchRunbooks()
    fetchAvailableTemplates()
    fetchAvailableEndpoints()
  }, [fetchRunbooks, fetchAvailableTemplates, fetchAvailableEndpoints])

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
      input_from_step_id: '',
      timeout_seconds: 300,
      retry_count: 0,
      retry_delay_seconds: 5,
      endpoint_config: null
    })

    try {
      const response = await fetch(`/api/runbooks/${runbook.id}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableStepsForInput(data.steps || [])
      }
    } catch (error) {
      console.error('Error fetching runbook steps:', error)
      setAvailableStepsForInput([])
    }

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
      input_from_step_id: step.input_from_step_id || '',
      timeout_seconds: step.timeout_seconds,
      retry_count: step.retry_count,
      retry_delay_seconds: step.retry_delay_seconds,
      endpoint_config: step.endpoint_config
    })

    try {
      const response = await fetch(`/api/runbooks/${runbook.id}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableStepsForInput(data.steps || [])
      }
    } catch (error) {
      console.error('Error fetching runbook steps:', error)
      setAvailableStepsForInput([])
    }

    setIsStepDrawerOpen(true)
  }

  const handleSaveStep = async () => {
    if (!currentRunbook) return

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
            <Input
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              placeholder="e.g., Blog Post Creation Workflow"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Description (Optional)</label>
            <Textarea
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Brief description of what this runbook does"
              className={styles.formTextarea}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Max Execution Time (minutes)</label>
            <Input
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
              size="sm"
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
            <Button onClick={handleSaveRunbook}>
              {editingRunbook ? 'Update Runbook' : 'Create Runbook'}
            </Button>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>
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
            <Input
              value={stepFormData.step_name}
              onChange={(value) => setStepFormData({ ...stepFormData, step_name: value })}
              placeholder="e.g., Generate blog outline"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Description (Optional)</label>
            <Textarea
              value={stepFormData.description}
              onChange={(value) => setStepFormData({ ...stepFormData, description: value })}
              placeholder="Brief description of what this step does"
              className={styles.formTextarea}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Step Type</label>
            <select
              value={stepFormData.step_type}
              onChange={(e) => setStepFormData({ ...stepFormData, step_type: e.target.value as 'ai_operation' | 'endpoint_call' })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="ai_operation">AI Operation</option>
              <option value="endpoint_call">Endpoint Call</option>
            </select>
          </div>

          {stepFormData.step_type === 'ai_operation' && (
            <div className={styles.formField}>
              <label className={styles.formLabel}>Prompt Template</label>
              <select
                value={stepFormData.prompt_template_id}
                onChange={(e) => setStepFormData({ ...stepFormData, prompt_template_id: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">Select a prompt template...</option>
              {availableTemplates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          )}

          {stepFormData.step_type === 'ai_operation' && (
          <div className={styles.formField}>
            <label className={styles.formLabel}>Endpoint</label>
            <select
              value={stepFormData.endpoint_id}
              onChange={(e) => setStepFormData({ ...stepFormData, endpoint_id: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">Select an endpoint...</option>
              {availableEndpoints.map(endpoint => (
                <option key={endpoint.id} value={endpoint.id}>
                  {endpoint.slug} ({endpoint.ai_models?.display_name} - {endpoint.ai_models?.ai_providers?.name})
                </option>
              ))}
            </select>
          </div>
          )}

          {stepFormData.step_type === 'endpoint_call' && (
            <div className={styles.formField}>
              <label className={styles.formLabel}>Endpoint Configuration</label>
              <Textarea
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
  "headers": {"Content-Type": "application/json"},
  "body_template": "{\\"input\\": \\"{{input}}\\"}",
  "response_mapping": {
    "output_path": "$.data",
    "output_key": "result"
  }
}`}
                className={styles.formTextarea}
                rows={8}
              />
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Configure the HTTP endpoint call. Use {"{{input}}"} to reference step input.
              </div>
            </div>
          )}

          <div className={styles.formField}>
            <label className={styles.formLabel}>Input Source (Optional)</label>
            <select
              value={stepFormData.input_from_step_id}
              onChange={(e) => setStepFormData({ ...stepFormData, input_from_step_id: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">Use runbook initial input</option>
              {availableStepsForInput
                .filter(step => !editingStep || step.id !== editingStep.id)
                .sort((a, b) => a.step_order - b.step_order)
                .map(step => (
                  <option key={step.id} value={step.id}>
                    Step {step.step_order}: {step.step_name}
                  </option>
                ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Timeout (seconds)</label>
            <Input
              type="number"
              value={stepFormData.timeout_seconds.toString()}
              onChange={(value) => setStepFormData({ ...stepFormData, timeout_seconds: parseInt(value) || 300 })}
              placeholder="300"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Retry Count</label>
            <Input
              type="number"
              value={stepFormData.retry_count.toString()}
              onChange={(value) => setStepFormData({ ...stepFormData, retry_count: parseInt(value) || 0 })}
              placeholder="0"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Retry Delay (seconds)</label>
            <Input
              type="number"
              value={stepFormData.retry_delay_seconds.toString()}
              onChange={(value) => setStepFormData({ ...stepFormData, retry_delay_seconds: parseInt(value) || 5 })}
              placeholder="5"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '2rem' }}>
            <Button onClick={handleSaveStep}>
              {editingStep ? 'Update Step' : 'Add Step'}
            </Button>
            <Button variant="secondary" onClick={() => setIsStepDrawerOpen(false)}>
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