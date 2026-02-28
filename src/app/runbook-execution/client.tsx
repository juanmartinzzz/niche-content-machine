'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button, Input, Textarea, Pill } from '@/components/interaction'
import { Play, Square, Loader2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

interface Runbook {
  id: string
  name: string
  description: string | null
  is_active: boolean
  steps: number
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
  step_type: 'ai_operation' | 'endpoint_call'
}

export const RunbookExecutionClient: React.FC = () => {
  const [runbooks, setRunbooks] = useState<Runbook[]>([])
  const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(null)
  const [initialInput, setInitialInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentExecution, setCurrentExecution] = useState<RunbookExecution | null>(null)
  const [stepExecutions, setStepExecutions] = useState<StepExecution[]>([])
  const [executionHistory, setExecutionHistory] = useState<RunbookExecution[]>([])

  const fetchRunbooks = useCallback(async () => {
    try {
      const response = await fetch('/api/runbooks')
      if (response.ok) {
        const data = await response.json()
        const activeRunbooks = data.filter((r: Runbook) => r.is_active)
        setRunbooks(activeRunbooks)
      }
    } catch (error) {
      console.error('Error fetching runbooks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchExecutionHistory = useCallback(async () => {
    if (!selectedRunbook) return

    try {
      // TODO: Create API endpoint to fetch execution history for a runbook
      // For now, we'll implement basic functionality
    } catch (error) {
      console.error('Error fetching execution history:', error)
    }
  }, [selectedRunbook])

  const executeRunbook = async () => {
    if (!selectedRunbook) return

    setIsExecuting(true)
    try {
      let parsedInput = null
      if (initialInput.trim()) {
        try {
          parsedInput = JSON.parse(initialInput)
        } catch (e) {
          parsedInput = initialInput
        }
      }

      const response = await fetch(`/api/runbooks/${selectedRunbook.id}/execute`, {
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
    setInitialInput('')
  }

  useEffect(() => {
    fetchRunbooks()
  }, [fetchRunbooks])

  useEffect(() => {
    if (selectedRunbook) {
      fetchExecutionHistory()
    }
  }, [selectedRunbook, fetchExecutionHistory])

  if (isLoading) {
    return <div>Loading runbooks...</div>
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Runbook Selection */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
          Select Runbook
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {runbooks.map(runbook => (
            <div
              key={runbook.id}
              style={{
                border: selectedRunbook?.id === runbook.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
                cursor: 'pointer',
                backgroundColor: selectedRunbook?.id === runbook.id ? '#f0f9ff' : 'white',
                transition: 'all 0.2s'
              }}
              onClick={() => setSelectedRunbook(runbook)}
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {runbook.name}
              </h3>
              {runbook.description && (
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  {runbook.description}
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pill label={`${runbook.steps} steps`} size="sm" />
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
        {runbooks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            No active runbooks available. Create and activate runbooks in the Runbooks section.
          </div>
        )}
      </div>

      {/* Execution Interface */}
      {selectedRunbook && !currentExecution && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
            Execute {selectedRunbook.name}
          </h2>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Initial Input (JSON or plain text, optional)
            </label>
            <Textarea
              value={initialInput}
              onChange={setInitialInput}
              placeholder="Enter initial input for the runbook..."
              rows={4}
            />
          </div>

          <Button
            onClick={executeRunbook}
            disabled={isExecuting}
          >
            {isExecuting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {isExecuting ? 'Starting Execution...' : 'Execute Runbook'}
          </Button>
        </div>
      )}

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
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            {stepExecutions.map((step, index) => (
              <div
                key={step.id}
                style={{
                  padding: '1rem',
                  borderBottom: index < stepExecutions.length - 1 ? '1px solid #e5e7eb' : 'none',
                  backgroundColor: step.step_status === 'completed' ? '#f0fdf4' :
                                   step.step_status === 'running' ? '#fefce8' :
                                   step.step_status === 'failed' ? '#fef2f2' : 'white'
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

                {step.step_input && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Input:
                    </div>
                    <pre style={{
                      fontSize: '0.75rem',
                      backgroundColor: '#f3f4f6',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '100px'
                    }}>
                      {JSON.stringify(step.step_input, null, 2)}
                    </pre>
                  </div>
                )}

                {step.step_output && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Output:
                    </div>
                    <pre style={{
                      fontSize: '0.75rem',
                      backgroundColor: '#f0fdf4',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '150px'
                    }}>
                      {JSON.stringify(step.step_output, null, 2)}
                    </pre>
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

          {/* Final Output */}
          {currentExecution.final_output && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Final Output
              </h3>
              <pre style={{
                fontSize: '0.875rem',
                backgroundColor: '#f0fdf4',
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto',
                border: '1px solid #d1fae5'
              }}>
                {JSON.stringify(currentExecution.final_output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}