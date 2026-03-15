import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient, getTableName } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const runbookId = searchParams.get('runbook_id')
    const requestedStatus = searchParams.get('status')?.trim().toLowerCase() || searchParams.get('execution_status')?.trim().toLowerCase() || ''
    const normalizedStatus = ['error', 'errored', 'fail'].includes(requestedStatus) ? 'failed' : requestedStatus
    const status = ['pending', 'running', 'completed', 'failed', 'cancelled'].includes(normalizedStatus || '') ? normalizedStatus : ''
    const sortBy = searchParams.get('sort_by') || 'started_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // Validate pagination parameters
    const validPage = Math.max(1, page)
    const validLimit = Math.min(100, Math.max(1, limit))
    const offset = (validPage - 1) * validLimit

    // Validate sort parameters
    const validSortFields = ['started_at', 'completed_at', 'created_at', 'execution_status']
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'started_at'
    const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    let query = supabaseAdmin
      .from(getTableName('ai_runbook_executions'))
      .select(`
        id,
        runbook_id,
        execution_status,
        initial_input,
        final_output,
        started_at,
        completed_at,
        total_execution_time_seconds,
        error_message,
        failed_at_step,
        created_at,
        updated_at
      `)

    // Apply filters
    if (runbookId) {
      query = query.eq('runbook_id', runbookId)
    }

    if (status === 'failed') {
      query = query.in('execution_status', ['failed', 'error'])
    } else if (status) {
      query = query.ilike('execution_status', status)
    }

    // Create count query (without select fields for proper counting)
    let countQuery = supabaseAdmin
      .from(getTableName('ai_runbook_executions'))
      .select('id', { count: 'exact', head: true })

    // Apply filters to count query
    if (runbookId) {
      countQuery = countQuery.eq('runbook_id', runbookId)
    }

    if (status === 'failed') {
      countQuery = countQuery.in('execution_status', ['failed', 'error'])
    } else if (status) {
      countQuery = countQuery.ilike('execution_status', status)
    }

    // Get total count for pagination
    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error getting count:', countError)
      return NextResponse.json({ error: 'Failed to get execution count' }, { status: 500 })
    }

    // Apply sorting to data query
    query = query.order(validSortBy, { ascending: validSortOrder === 'asc' })

    // Apply pagination and get results
    const { data: executions, error } = await query
      .range(offset, offset + validLimit - 1)

    if (error) {
      console.error('Error fetching executions:', error)
      return NextResponse.json({ error: 'Failed to fetch executions' }, { status: 500 })
    }

    const totalPages = Math.ceil((count || 0) / validLimit)

    return NextResponse.json({
      executions: executions || [],
      pagination: {
        page: validPage,
        limit: validLimit,
        total: count || 0,
        totalPages,
        hasNext: validPage < totalPages,
        hasPrev: validPage > 1
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}