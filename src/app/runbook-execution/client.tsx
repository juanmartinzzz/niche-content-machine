'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button, Textarea, Pill, JsonTreeViewer } from '@/components/interaction'
import { Play, Square, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Runbook {
  id: string
  name: string
  description: string | null
  is_active: boolean
  steps: number
  step_names: string[]
}

interface RunbookExecution {
  id: string
  execution_status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  initial_input: any
  final_output: any
  error_message: string | null
  started_at: string
  completed_at: string | null
  total_execution_time_seconds: number | null
}

interface StepExecution {
  id: string
  runbook_step_id: string
  step_status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  step_input: any
  step_output: any
  error_message: string | null
  started_at: string
  completed_at: string | null
  execution_time_seconds: number | null
  step_name: string
  step_order: number
  step_type: 'ai_operation' | 'endpoint_call' | 'telegram_message'
}

export const RunbookExecutionClient: React.FC = () => {
  const [runbooks, setRunbooks] = useState<Runbook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentExecution, setCurrentExecution] = useState<RunbookExecution | null>(null)
  const [stepExecutions, setStepExecutions] = useState<StepExecution[]>([])
  const [executionHistory, setExecutionHistory] = useState<RunbookExecution[]>([])
  const [inputModeRunbookId, setInputModeRunbookId] = useState<string | null>(null)
  const [initialInputs, setInitialInputs] = useState<Record<string, string>>({})

  const fetchRunbooks = useCallback(async () => {
    try {
      const response = await fetch('/api/runbooks')
      if (response.ok) {
        const data = await response.json()
        const activeRunbooks = data.filter((r: Runbook) => r.is_active)
        const runbooksWithStepNames = await Promise.all(
          activeRunbooks.map(async (runbook: Runbook) => {
            let stepNames: string[] = []
            try {
              const stepsResponse = await fetch(`/api/runbooks/${runbook.id}/steps`)
              if (stepsResponse.ok) {
                const steps = await stepsResponse.json()
                if (Array.isArray(steps)) {
                  stepNames = steps
                    .map((step: { step_name?: string }) => step.step_name)
                    .filter((name): name is string => Boolean(name && name.trim()))
                }
              }
            } catch (error) {
              console.error('Error fetching step names:', error)
            }
            return { ...runbook, step_names: stepNames }
          })
        )
        setRunbooks(runbooksWithStepNames)
      }
    } catch (error) {
      console.error('Error fetching runbooks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleExecuteClick = (runbook: Runbook) => {
    if (inputModeRunbookId === runbook.id) {
      // Already in input mode, execute the runbook
      executeRunbook(runbook)
    } else {
      // Enter input mode for this runbook
      setInputModeRunbookId(runbook.id)
    }
  }

  const handleInputChange = (runbookId: string, value: string) => {
    setInitialInputs(prev => ({
      ...prev,
      [runbookId]: value
    }))
  }

  const executeRunbook = async (runbook: Runbook) => {
    // Reset input mode when starting execution
    setInputModeRunbookId(null)
    setIsExecuting(true)
    try {
      // Get initial input for this runbook
      const inputValue = initialInputs[runbook.id] || ''
      let parsedInput = null
      if (inputValue.trim()) {
        try {
          parsedInput = JSON.parse(inputValue)
        } catch (e) {
          alert('Invalid JSON format. Please enter valid JSON or leave the input empty.')
          setIsExecuting(false)
          return
        }
      }

      const response = await fetch(`/api/runbooks/${runbook.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initial_input: parsedInput })
      })

      if (response.ok) {
        const { execution_id } = await response.json()
        // Start polling for execution status
        pollExecutionStatus(execution_id)
      } else {
        const errorData = await response.json()
        alert(`Error starting execution: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error executing runbook:', error)
      alert('Error executing runbook. Please try again.')
    } finally {
      setIsExecuting(false)
    }
  }

  const pollExecutionStatus = (executionId: string) => {
    const poll = async () => {
      try {
        // Fetch execution status
        const execResponse = await fetch(`/api/runbooks/executions/${executionId}`)
        if (execResponse.ok) {
          const execution = await execResponse.json()
          setCurrentExecution(execution)

          // Fetch step executions
          const stepsResponse = await fetch(`/api/runbooks/executions/${executionId}/steps`)
          if (stepsResponse.ok) {
            const steps = await stepsResponse.json()
            setStepExecutions(steps)
          }

          // Continue polling if still running
          if (execution.execution_status === 'running') {
            setTimeout(poll, 2000) // Poll every 2 seconds
          }
        }
      } catch (error) {
        console.error('Error polling execution status:', error)
      }
    }

    poll()
  }

  const cancelExecution = async () => {
    if (!currentExecution) return

    try {
      const response = await fetch(`/api/runbooks/executions/${currentExecution.id}/cancel`, {
        method: 'POST'
      })

      if (response.ok) {
        setCurrentExecution(null)
        setStepExecutions([])
      } else {
        alert('Failed to cancel execution')
      }
    } catch (error) {
      console.error('Error cancelling execution:', error)
      alert('Error cancelling execution')
    }
  }

  const resetExecution = () => {
    setCurrentExecution(null)
    setStepExecutions([])
    setInputModeRunbookId(null)
  }

  useEffect(() => {
    fetchRunbooks()
  }, [fetchRunbooks])


  if (isLoading) {
    return <div>Loading runbooks...</div>
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Runbook Selection */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {runbooks.map(runbook => (
            <div
              key={runbook.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
                backgroundColor: 'white',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  pointerEvents: 'none'
                }}
              >
                <Pill label="Active" size="xs" selected />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {runbook.name}
              </h3>
              {runbook.description && (
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  {runbook.description}
                </p>
              )}
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.625rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Steps
                </div>
                <ol
                  style={{
                    margin: 0,
                    paddingLeft: '1rem',
                    display: 'grid',
                    gap: '0.2rem',
                    color: '#4b5563',
                    fontSize: '0.68rem',
                    lineHeight: 1.25
                  }}
                >
                  {runbook.step_names.map((stepName, idx) => (
                    <li key={`${runbook.id}-${idx}`} title={stepName} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {idx + 1}. {stepName}
                    </li>
                  ))}
                </ol>
              </div>
              {inputModeRunbookId === runbook.id && (
                <div style={{ marginBottom: '1rem' }}>
                  <JsonTreeViewer
                    value={initialInputs[runbook.id] || ''}
                    onChange={(value) => handleInputChange(runbook.id, value)}
                    placeholder="Enter initial input for the runbook..."
                    label="Initial Input (JSON, optional)"
                  />
                </div>
              )}

              <Button
                onClick={() => handleExecuteClick(runbook)}
                disabled={isExecuting}
                size="sm"
                className="w-full"
              >
                {isExecuting ? <Loader2 size={16} className="animate-spin" style={{ marginRight: '8px' }} /> : <Play size={16} style={{ marginRight: '8px' }} />}
                {isExecuting ? 'Executing...' : inputModeRunbookId === runbook.id ? 'Execute Runbook' : 'Execute'}
              </Button>
            </div>
          ))}
        </div>
        {runbooks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            No active runbooks available. Create and activate runbooks in the Runbooks section.
          </div>
        )}
      </div>


      {/* Execution Progress */}
      {currentExecution && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>
              Execution Progress
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={cancelExecution}
                disabled={currentExecution.execution_status !== 'running'}
              >
                <Square size={16} style={{ marginRight: '4px' }} />
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={resetExecution}
              >
                New Execution
              </Button>
            </div>
          </div>

          {/* Execution Status */}
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {currentExecution.execution_status === 'running' && <Loader2 size={16} className="animate-spin" />}
              {currentExecution.execution_status === 'completed' && <CheckCircle size={16} style={{ color: '#10b981' }} />}
              {currentExecution.execution_status === 'failed' && <XCircle size={16} style={{ color: '#ef4444' }} />}
              <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                {currentExecution.execution_status}
              </span>
            </div>

            {currentExecution.error_message && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                {currentExecution.error_message}
              </div>
            )}
          </div>

          {/* Step Progress */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {stepExecutions.map((step) => (
              <div
                key={step.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1rem',
                  backgroundColor: 'white'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {step.step_status === 'pending' && <Clock size={16} style={{ color: '#6b7280' }} />}
                  {step.step_status === 'running' && <Loader2 size={16} className="animate-spin" style={{ color: '#f59e0b' }} />}
                  {step.step_status === 'completed' && <CheckCircle size={16} style={{ color: '#10b981' }} />}
                  {step.step_status === 'failed' && <XCircle size={16} style={{ color: '#ef4444' }} />}
                  <span style={{ fontWeight: '500' }}>
                    Step {step.step_order}: {step.step_name}
                  </span>
                  <Pill label={step.step_type} size="sm" />
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'capitalize' }}>
                    {step.step_status}
                  </span>
                </div>

                {(step.step_input || step.step_output) && (
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                    {step.step_input && (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                          Input:
                        </div>
                        <Textarea
                          value={JSON.stringify(step.step_input, null, 2)}
                          autoResize={true}
                          monospace={true}
                        />
                      </div>
                    )}

                    {step.step_output && (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                          Output:
                        </div>
                        <Textarea
                          value={JSON.stringify(step.step_output, null, 2)}
                          autoResize={true}
                          monospace={true}
                        />
                      </div>
                    )}
                  </div>
                )}

                {step.error_message && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#ef4444', marginBottom: '0.25rem' }}>
                      Error:
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.5rem', borderRadius: '4px' }}>
                      {step.error_message}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  )
}