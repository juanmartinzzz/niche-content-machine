'use client'

import React, { useCallback, useState } from 'react'
import {
  Button,
  useToast
} from '@/components/interaction'
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Play
} from 'lucide-react'
import styles from './client.module.css'

const TREND_TEMPLATE_ID = '03fdb2a4-be25-4bf3-a3ef-01bba5aeb97f'
const TREND_ENDPOINT_ID = '4edd9172-43d1-4b5e-8a89-7bcaa31d55c0'
const TREND_RUNBOOK_ID = 'mock-runbook-uuid'

type RawTrendResponse = Record<string, unknown>

interface Trend {
  id: string
  categoryName: string
  name: string
  description: string
  firstAppearedDate: string
  controversyFactor: number
  technicalDifficultyFactor: number
  longevityFactor: number
  audiences?: {
    primary?: string[]
    seniorityRange?: string
  }
  toolsAndFrameworks?: string[]
  geographicRelevance?: string[]
}

interface RunbookExecutionState {
  status: 'idle' | 'running' | 'success' | 'error'
  executionId?: string
  error?: string
}

const isRecord = (value: unknown): value is RawTrendResponse => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const toStringValue = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : ''
}

const toNumberValue = (value: unknown): number | null => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  return parsed
}

const clampToRange = (value: number): number => {
  return Math.max(0, Math.min(100, value))
}

const normalizeTrend = (raw: unknown, index: number): Trend | null => {
  if (!isRecord(raw)) return null

  const categoryName = toStringValue(raw.categoryName)
  const name = toStringValue(raw.name)
  const description = toStringValue(raw.description)
  const firstAppearedDate = toStringValue(raw.firstAppearedDate)
  const controversyFactor = toNumberValue(raw.controversyFactor)
  const technicalDifficultyFactor = toNumberValue(raw.technicalDifficultyFactor)
  const longevityFactor = toNumberValue(raw.longevityFactor)

  if (
    !categoryName ||
    !name ||
    !description ||
    !firstAppearedDate ||
    controversyFactor === null ||
    technicalDifficultyFactor === null ||
    longevityFactor === null
  ) {
    return null
  }

  const rawAudiences = isRecord(raw.audiences) ? raw.audiences : undefined
  const primary = Array.isArray(rawAudiences?.primary)
    ? rawAudiences.primary.filter((value): value is string => typeof value === 'string').map((value) => value.trim()).filter(Boolean)
    : []
  const seniorityRange = toStringValue(rawAudiences?.seniorityRange)

  const toolsAndFrameworks = Array.isArray(raw.toolsAndFrameworks)
    ? raw.toolsAndFrameworks.filter((value): value is string => typeof value === 'string').map((value) => value.trim()).filter(Boolean)
    : []
  const geographicRelevance = Array.isArray(raw.geographicRelevance)
    ? raw.geographicRelevance.filter((value): value is string => typeof value === 'string').map((value) => value.trim()).filter(Boolean)
    : []

  return {
    id: `trend-${index}-${name.toLowerCase().replace(/\s+/g, '-')}`,
    categoryName,
    name,
    description,
    firstAppearedDate,
    controversyFactor: clampToRange(controversyFactor),
    technicalDifficultyFactor: clampToRange(technicalDifficultyFactor),
    longevityFactor: clampToRange(longevityFactor),
    audiences: {
      ...(primary.length > 0 ? { primary } : {}),
      ...(seniorityRange ? { seniorityRange } : {})
    },
    ...(toolsAndFrameworks.length > 0 ? { toolsAndFrameworks } : {}),
    ...(geographicRelevance.length > 0 ? { geographicRelevance } : {})
  }
}

const extractTextFromGenerateResponse = (payload: unknown): string | null => {
  if (!isRecord(payload)) return null

  const response = payload.response
  if (!isRecord(response)) {
    return null
  }

  const output = Array.isArray(response.output) ? response.output : []
  const xAiText = output[0]?.content?.[0]?.text
  if (typeof xAiText === 'string') {
    return xAiText.trim()
  }

  const xAiLastMessageText = output.length > 0
    ? output[output.length - 1]?.content?.[0]?.text
    : undefined
  if (typeof xAiLastMessageText === 'string') {
    return xAiLastMessageText.trim()
  }

  const openAiText = response.choices?.[0]?.message?.content
  if (typeof openAiText === 'string') {
    return openAiText.trim()
  }

  if (typeof response.text === 'string') {
    return response.text.trim()
  }

  return null
}

const tryParseJson = (input: string): unknown | null => {
  const normalized = input.trim()
  if (!normalized) return null

  try {
    return JSON.parse(normalized)
  } catch {
    return null
  }
}

const parseFencedJson = (input: string): string | null => {
  const fencedMatch = input.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (!fencedMatch) {
    return null
  }
  return fencedMatch[1]?.trim() || null
}

const parseTrendsPayload = (payload: unknown): Trend[] => {
  const candidatePayloads: unknown[] = [payload]

  const responseText = extractTextFromGenerateResponse(payload)
  if (responseText) {
    const directJson = tryParseJson(responseText)
    if (directJson) {
      candidatePayloads.push(directJson)
    } else {
      const fenced = parseFencedJson(responseText)
      if (fenced) {
        const fencedJson = tryParseJson(fenced)
        if (fencedJson) {
          candidatePayloads.push(fencedJson)
        }
      }
    }
  }

  const trendEntries = candidatePayloads
    .map((candidate) => {
      if (Array.isArray(candidate)) return candidate
      if (!isRecord(candidate)) return null
      const container = candidate.trends
      return Array.isArray(container) ? container : null
    })
    .find((entry) => entry !== null)

  if (!trendEntries) {
    throw new Error('Could not find a trends array in the model response.')
  }

  const normalized = trendEntries
    .map((raw, index) => normalizeTrend(raw, index))
    .filter((trend): trend is Trend => trend !== null)

  if (normalized.length === 0) {
    throw new Error('Model response did not contain valid trend entries.')
  }

  return normalized
}

const limitWords = (value: string, maxWords: number): string => {
  const words = value.trim().split(/\s+/)
  if (words.length <= maxWords) return value.trim()
  return `${words.slice(0, maxWords).join(' ')}…`
}

const arrayToLine = (values: string[] | undefined): string => {
  if (!values || values.length === 0) return 'Not provided'
  return values.join(', ')
}

const factorColorClass = (value: number): string => {
  if (value >= 75) return styles.factorHigh
  if (value >= 40) return styles.factorMedium
  return styles.factorLow
}

export const FindTrendClient: React.FC = () => {
  const { showToast } = useToast()
  const [trends, setTrends] = useState<Trend[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [runbookStates, setRunbookStates] = useState<Record<string, RunbookExecutionState>>({})

  const generateTrends = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint_id: TREND_ENDPOINT_ID,
          prompt_template_id: TREND_TEMPLATE_ID,
          variables: {}
        })
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        const errorText = errorPayload?.error || 'Failed to generate trend results.'
        throw new Error(errorText)
      }

      const payload = await response.json()
      const parsedTrends = parseTrendsPayload(payload)

      setTrends(parsedTrends)
      setExpanded(parsedTrends.reduce<Record<string, boolean>>((acc, trend) => {
        acc[trend.id] = false
        return acc
      }, {}))
      setRunbookStates({})
      showToast('Trends generated successfully.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error while generating trends.'
      setLoadError(message)
      setTrends([])
      setExpanded({})
      setRunbookStates({})
      showToast(message, 'error')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  const toggleExpanded = (trendId: string) => {
    setExpanded((previous) => ({
      ...previous,
      [trendId]: !previous[trendId]
    }))
  }

  const runTrendRunbook = async (trend: Trend) => {
    const { id: trendId, ...trendInput } = trend

    setRunbookStates((previous) => ({
      ...previous,
      [trendId]: { status: 'running' }
    }))

    try {
      const response = await fetch(`/api/runbooks/${TREND_RUNBOOK_ID}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          initial_input: trendInput
        })
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        const errorText = errorPayload?.error || 'Failed to start the trend runbook.'
        throw new Error(errorText)
      }

      const runPayload = await response.json()
      const executionId = runPayload.execution_id
      setRunbookStates((previous) => ({
        ...previous,
        [trendId]: {
          status: 'success',
          executionId,
          error: undefined
        }
      }))
      showToast('Runbook started for trend.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run trend runbook.'
      setRunbookStates((previous) => ({
        ...previous,
        [trendId]: {
          status: 'error',
          error: message
        }
      }))
      showToast(message, 'error')
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pick Trend</h1>
          <p className={styles.subtitle}>
            Generate trend candidates from your configured prompt template and run a runbook directly from each card.
          </p>
        </div>
        <Button
          onClick={() => void generateTrends()}
          size="sm"
          disabled={isLoading}
          className={styles.generateButton}
        >
          {isLoading ? <Loader2 size={14} className={styles.spinner} /> : <Play size={14} />}
          {isLoading ? 'Generating…' : 'Generate Trends'}
        </Button>
      </div>

      {loadError && (
        <div className={styles.alertError}>
          {loadError}
        </div>
      )}

      {trends.length === 0 && !isLoading && !loadError && (
        <div className={styles.emptyState}>
          No trend results yet. Click <strong>Generate Trends</strong> to generate the first set.
        </div>
      )}

      <div className={styles.grid}>
        {trends.map((trend) => {
          const isExpanded = expanded[trend.id]
          const state = runbookStates[trend.id] || { status: 'idle' as const }

          return (
            <article key={trend.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.trendName}>{trend.name}</h2>
                  <p className={styles.trendCategory}>{trend.categoryName}</p>
                </div>
                <span className={styles.datePill}>{trend.firstAppearedDate}</span>
              </div>

              <p className={styles.trendDescription}>{limitWords(trend.description, 24)}</p>

              <div className={styles.factorGrid}>
                <div className={styles.factorItem}>
                  <span className={styles.factorLabel}>Controversy</span>
                  <span className={`${styles.factorValue} ${factorColorClass(trend.controversyFactor)}`}>
                    {trend.controversyFactor}
                  </span>
                </div>
                <div className={styles.factorItem}>
                  <span className={styles.factorLabel}>Difficulty</span>
                  <span className={`${styles.factorValue} ${factorColorClass(trend.technicalDifficultyFactor)}`}>
                    {trend.technicalDifficultyFactor}
                  </span>
                </div>
                <div className={styles.factorItem}>
                  <span className={styles.factorLabel}>Longevity</span>
                  <span className={`${styles.factorValue} ${factorColorClass(trend.longevityFactor)}`}>
                    {trend.longevityFactor}
                  </span>
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.actionRow}>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => toggleExpanded(trend.id)}
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>{isExpanded ? 'Less info' : 'More info'}</span>
                </Button>

                <Button
                  size="xs"
                  onClick={() => void runTrendRunbook(trend)}
                  disabled={state.status === 'running'}
                >
                  {state.status === 'running' ? <Loader2 size={14} className={styles.spinner} /> : <Play size={14} />}
                  {state.status === 'running' ? 'Starting…' : 'Run runbook'}
                </Button>
              </div>

              {isExpanded && (
                <div className={styles.expandedSection}>
                  <div className={styles.expandedField}>
                    <h3>Audience</h3>
                    <p><span>Primary:</span> {arrayToLine(trend.audiences?.primary)}</p>
                    <p><span>Seniority:</span> {trend.audiences?.seniorityRange || 'Not provided'}</p>
                  </div>

                  <div className={styles.expandedField}>
                    <h3>Tools & Frameworks</h3>
                    <p>{arrayToLine(trend.toolsAndFrameworks)}</p>
                  </div>

                  <div className={styles.expandedField}>
                    <h3>Geographic Relevance</h3>
                    <p>{arrayToLine(trend.geographicRelevance)}</p>
                  </div>

                  <div className={styles.expandedField}>
                    <h3>Description</h3>
                    <p>{trend.description}</p>
                  </div>
                </div>
              )}

              {state.status === 'success' && (
                <div className={styles.successRow}>
                  Runbook started <span>({state.executionId})</span>
                </div>
              )}
              {state.status === 'error' && (
                <div className={styles.errorRow}>
                  {state.error}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
