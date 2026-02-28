-- AI Runbook Executions table for tracking runbook runs
-- Logs when runbooks are executed and their overall results

CREATE TABLE IF NOT EXISTS ncm_ai_runbook_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relationships
  runbook_id UUID NOT NULL REFERENCES ncm_ai_runbooks(id) ON DELETE CASCADE,

  -- Execution details
  execution_status VARCHAR(20) DEFAULT 'pending' CHECK (execution_status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  initial_input JSONB, -- Initial input provided to the runbook (if any)
  final_output JSONB, -- Final result after all steps complete

  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_execution_time_seconds INTEGER,

  -- Error tracking
  error_message TEXT,
  failed_at_step UUID REFERENCES ncm_ai_runbook_steps(id),

  -- Metadata
  triggered_by UUID, -- User or system that triggered execution
  execution_context JSONB, -- Additional context (environment, parameters, etc.)

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for runbook executions
CREATE INDEX IF NOT EXISTS idx_ncm_ai_runbook_executions_runbook ON ncm_ai_runbook_executions(runbook_id);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_runbook_executions_status ON ncm_ai_runbook_executions(execution_status);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_runbook_executions_started ON ncm_ai_runbook_executions(started_at);

-- Row Level Security (RLS)
ALTER TABLE ncm_ai_runbook_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage AI runbook executions" ON ncm_ai_runbook_executions FOR ALL USING (auth.role() = 'service_role');

-- Timestamp trigger for updated_at
CREATE TRIGGER update_ai_runbook_executions_updated_at
  BEFORE UPDATE ON ncm_ai_runbook_executions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();