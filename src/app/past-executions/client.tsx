'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button, ExpandableTable, PillList, Select, Textarea, type TableColumn, type SelectOption } from '@/components/interaction'
import { CheckCircle, XCircle, Clock, Loader2, AlertCircle, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatHumanReadableDate } from '@/utils/time'

interface Runbook {
  id: string
  name: string
  description: string | null
}

interface Execution {
  id: string
  runbook_id: string
  execution_status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  initial_input: any
  final_output: any
  started_at: string
  completed_at: string | null
  total_execution_time_seconds: number | null
  error_message: string | null
  failed_at_step: string | null
  created_at: string
  updated_at: string
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

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface ApiResponse {
  executions: Execution[]
  pagination: PaginationInfo
}

export const PastExecutionsClient: React.FC = () => {
  const [executions, setExecutions] = useState<Execution[]>([])
  const [runbooks, setRunbooks] = useState<Runbook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)

  // Filters
  const [selectedRunbook, setSelectedRunbook] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const fetchRunbooks = useCallback(async () => {
    try {
      const response = await fetch('/api/runbooks')
      if (response.ok) {
        const data = await response.json()
        setRunbooks(data)
      }
    } catch (error) {
      console.error('Error fetching runbooks:', error)
    }
  }, [])

  const fetchExecutions = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sort_by: 'started_at',
        sort_order: 'desc'
      })

      if (selectedRunbook) {
        params.set('runbook_id', selectedRunbook)
      }

      if (selectedStatus) {
        params.set('status', selectedStatus)
      }

      const response = await fetch(`/api/runbooks/executions?${params}`)
      if (response.ok) {
        const data: ApiResponse = await response.json()
        setExecutions(data.executions)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching executions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, selectedRunbook, selectedStatus])

  const fetchStepExecutions = useCallback(async (executionId: string): Promise<StepExecution[]> => {
    try {
      const response = await fetch(`/api/runbooks/executions/${executionId}/steps`)
      if (response.ok) {
        return await response.json()
      }
      return []
    } catch (error) {
      console.error('Error fetching step executions:', error)
      return []
    }
  }, [])


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} style={{ color: '#10b981' }} />
      case 'failed':
        return <XCircle size={16} style={{ color: '#ef4444' }} />
      case 'running':
        return <Loader2 size={16} className="animate-spin" style={{ color: '#f59e0b' }} />
      case 'pending':
        return <Clock size={16} style={{ color: '#6b7280' }} />
      case 'cancelled':
        return <AlertCircle size={16} style={{ color: '#6b7280' }} />
      default:
        return <Clock size={16} style={{ color: '#6b7280' }} />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: '#dcfce7',
      failed: '#fef2f2',
      running: '#fef3c7',
      pending: '#f3f4f6',
      cancelled: '#f3f4f6'
    }

    const textColors: Record<string, string> = {
      completed: '#166534',
      failed: '#dc2626',
      running: '#d97706',
      pending: '#374151',
      cancelled: '#374151'
    }

    return {
      backgroundColor: colors[status] || colors.pending,
      color: textColors[status] || textColors.pending,
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500',
      textTransform: 'capitalize' as const
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-'
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  useEffect(() => {
    fetchRunbooks()
  }, [fetchRunbooks])

  useEffect(() => {
    fetchExecutions()
  }, [fetchExecutions])

  const runbookOptions: SelectOption[] = [
    { id: '', label: 'All Runbooks' },
    ...runbooks.map(runbook => ({
      id: runbook.id,
      label: runbook.name
    }))
  ]

  const statusOptions: SelectOption[] = [
    { id: '', label: 'All Statuses' },
    { id: 'completed', label: 'Completed' },
    { id: 'failed', label: 'Failed' },
    { id: 'running', label: 'Running' },
    { id: 'pending', label: 'Pending' },
    { id: 'cancelled', label: 'Cancelled' }
  ]

  const columns: TableColumn<Execution>[] = [
    {
      key: 'runbook',
      header: 'Runbook',
      render: (execution) => {
        const runbook = runbooks.find(r => r.id === execution.runbook_id)
        return (
          <div>
            <div style={{ fontWeight: '500' }}>
              {runbook?.name || 'Unknown Runbook'}
            </div>
            {runbook?.description && (
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                {runbook.description}
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (execution) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {getStatusIcon(execution.execution_status)}
          <span style={getStatusBadge(execution.execution_status)}>
            {execution.execution_status}
          </span>
        </div>
      )
    },
    {
      key: 'started_at',
      header: 'Started',
      render: (execution) => formatHumanReadableDate(execution.started_at)
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (execution) => formatDuration(execution.total_execution_time_seconds)
    },
  ]

  const ExecutionDetails: React.FC<{ execution: Execution }> = ({ execution }) => {
    const [steps, setSteps] = useState<StepExecution[]>([])
    const [loadingSteps, setLoadingSteps] = useState(false)

    useEffect(() => {
      setLoadingSteps(true)
      fetchStepExecutions(execution.id).then((stepData) => {
        setSteps(stepData)
        setLoadingSteps(false)
      })
    }, [execution.id])

    return (
      <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', marginTop: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Execution Details</h4>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              <div><strong>ID:</strong> {execution.id}</div>
              <div><strong>Started:</strong> {new Date(execution.started_at).toLocaleString()}</div>
              {execution.completed_at && (
                <div><strong>Completed:</strong> {new Date(execution.completed_at).toLocaleString()}</div>
              )}
              <div><strong>Duration:</strong> {formatDuration(execution.total_execution_time_seconds)}</div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Input</h4>
            {execution.initial_input && (
              <div>
                <pre style={{
                  fontSize: '11px',
                  backgroundColor: '#f3f4f6',
                  padding: '8px',
                  borderRadius: '4px',
                  maxHeight: '100px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(execution.initial_input, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {execution.error_message && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#dc2626', marginBottom: '4px' }}>Error:</div>
            <div style={{
              fontSize: '12px',
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              padding: '8px',
              borderRadius: '4px'
            }}>
              {execution.error_message}
            </div>
          </div>
        )}

        <div>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Step Executions</h4>
          {loadingSteps ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6b7280' }}>
              <Loader2 size={12} className="animate-spin" />
              Loading steps...
            </div>
          ) : steps.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#6b7280' }}>No steps found</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {steps
                .sort((a, b) => a.step_order - b.step_order)
                .map((step) => (
                  <div key={step.id} style={{
                    padding: '8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    backgroundColor: 'white'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {getStatusIcon(step.step_status)}
                      <span style={{ fontSize: '12px', fontWeight: '500' }}>
                        Step {step.step_order}: {step.step_name}
                      </span>
                      <span style={getStatusBadge(step.step_status)}>
                        {step.step_status}
                      </span>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>
                        {formatDuration(step.execution_time_seconds)}
                      </span>
                    </div>

                    {(step.step_input || step.step_output) && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        {step.step_input && (
                          <div style={{ flex: 1 }}>
                            <Textarea
                              label="Input"
                              value={JSON.stringify(step.step_input, null, 2)}
                              monospace={true}
                              autoResize={true}
                              rows={4}
                              size="sm"
                            />
                          </div>
                        )}

                        {step.step_output && (
                          <div style={{ flex: 1 }}>
                            <Textarea
                              label="Output"
                              value={JSON.stringify(step.step_output, null, 2)}
                              monospace={true}
                              autoResize={true}
                              rows={4}
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {step.error_message && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '500', color: '#dc2626', marginBottom: '2px' }}>Error:</div>
                        <div style={{
                          fontSize: '11px',
                          color: '#dc2626',
                          backgroundColor: '#fef2f2',
                          padding: '4px',
                          borderRadius: '2px'
                        }}>
                          {step.error_message}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isLoading && executions.length === 0) {
    return <div>Loading executions...</div>
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ minWidth: '200px' }}>
          <Select
            label="Filter by Runbook"
            value={selectedRunbook}
            onChange={setSelectedRunbook}
            options={runbookOptions}
            size="sm"
          />
        </div>

        <div style={{ minWidth: '150px' }}>
          <Select
            label="Filter by Status"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={statusOptions}
            size="sm"
          />
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setSelectedRunbook('')
            setSelectedStatus('')
            setCurrentPage(1)
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Results Summary */}
      {pagination && (
        <div style={{ marginBottom: '1rem', fontSize: '14px', color: '#6b7280' }}>
          Showing {executions.length} of {pagination.total} executions
          {selectedRunbook && ` for selected runbook`}
          {selectedStatus && ` with status "${selectedStatus}"`}
        </div>
      )}

      {/* Table */}
      <ExpandableTable
        data={executions}
        columns={columns}
        getRowKey={(execution) => execution.id}
        emptyMessage="No executions found. Run some runbooks to see their execution history."
        expandableContent={(execution) => <ExecutionDetails execution={execution} />}
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '2rem',
          padding: '1rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Page {pagination.page} of {pagination.totalPages}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Button
              size="sm"
              variant="secondary"
              disabled={!pagination.hasPrev}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <ChevronLeft size={16} />
              Previous
            </Button>

            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={pageNum === currentPage ? "primary" : "secondary"}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              size="sm"
              variant="secondary"
              disabled={!pagination.hasNext}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>

          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {pagination.total} total executions
          </div>
        </div>
      )}
    </div>
  )
}