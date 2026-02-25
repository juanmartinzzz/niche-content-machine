-- AI Runbooks table for linear execution workflows
-- Defines sequences of prompt template executions that run one after another

CREATE TABLE IF NOT EXISTS ncm_ai_runbooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Basic info
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,

  -- Configuration
  max_execution_time_minutes INTEGER DEFAULT 30, -- Timeout protection
  on_error_behavior VARCHAR(20) DEFAULT 'stop' CHECK (on_error_behavior IN ('stop', 'continue')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for runbooks
CREATE INDEX IF NOT EXISTS idx_ncm_ai_runbooks_active ON ncm_ai_runbooks(is_active) WHERE is_active = true;

-- Row Level Security (RLS)
ALTER TABLE ncm_ai_runbooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage AI runbooks" ON ncm_ai_runbooks FOR ALL USING (auth.role() = 'service_role');

-- Timestamp trigger for updated_at
CREATE TRIGGER update_ai_runbooks_updated_at
  BEFORE UPDATE ON ncm_ai_runbooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- AI Runbook Steps table for ordered execution within runbooks
-- Each step references a prompt template and optionally takes input from a previous step

CREATE TABLE IF NOT EXISTS ncm_ai_runbook_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relationships
  runbook_id UUID NOT NULL REFERENCES ncm_ai_runbooks(id) ON DELETE CASCADE,
  prompt_template_id UUID NOT NULL REFERENCES ncm_ai_prompt_templates(id) ON DELETE RESTRICT,
  endpoint_id UUID NOT NULL REFERENCES ncm_ai_endpoints(id) ON DELETE RESTRICT,

  -- Step configuration
  step_order INTEGER NOT NULL, -- Execution order (1, 2, 3...)
  step_name VARCHAR(255) NOT NULL, -- Human-readable name
  description TEXT,

  -- Input handling (references previous step outputs)
  input_from_step_id UUID REFERENCES ncm_ai_runbook_steps(id) ON DELETE SET NULL, -- NULL = use runbook initial input

  -- Execution settings
  timeout_seconds INTEGER DEFAULT 300,
  retry_count INTEGER DEFAULT 0,
  retry_delay_seconds INTEGER DEFAULT 5,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Constraints
  UNIQUE(runbook_id, step_order)
);

-- Update table to add endpoint_id
ALTER TABLE ncm_ai_runbook_steps ADD COLUMN endpoint_id UUID NOT NULL REFERENCES ncm_ai_endpoints(id) ON DELETE RESTRICT;

-- Indexes for runbook steps
CREATE INDEX IF NOT EXISTS idx_ncm_ai_runbook_steps_runbook_order ON ncm_ai_runbook_steps(runbook_id, step_order);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_runbook_steps_template ON ncm_ai_runbook_steps(prompt_template_id);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_runbook_steps_endpoint ON ncm_ai_runbook_steps(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_runbook_steps_input_from ON ncm_ai_runbook_steps(input_from_step_id);

-- Row Level Security (RLS)
ALTER TABLE ncm_ai_runbook_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage AI runbook steps" ON ncm_ai_runbook_steps FOR ALL USING (auth.role() = 'service_role');

-- Timestamp trigger for updated_at
CREATE TRIGGER update_ai_runbook_steps_updated_at
  BEFORE UPDATE ON ncm_ai_runbook_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


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


-- AI Runbook Step Executions table for individual step tracking
-- Logs the execution of each step within a runbook execution

CREATE TABLE IF NOT EXISTS ncm_ai_runbook_step_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relationships
  runbook_execution_id UUID NOT NULL REFERENCES ncm_ai_runbook_executions(id) ON DELETE CASCADE,
  runbook_step_id UUID NOT NULL REFERENCES ncm_ai_runbook_steps(id) ON DELETE CASCADE,

  -- Execution details
  step_status VARCHAR(20) DEFAULT 'pending' CHECK (step_status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
  step_input JSONB, -- Input provided to this step (from previous step or initial)
  step_output JSONB, -- Output generated by this step

  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  execution_time_seconds INTEGER,

  -- Error handling
  error_message TEXT,
  retry_attempt INTEGER DEFAULT 0,

  -- AI request tracking (links to existing ai_request_logs)
  ai_request_log_id UUID REFERENCES ncm_ai_request_logs(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for runbook step executions
CREATE INDEX IF NOT EXISTS idx_ncm_ai_runbook_step_executions_execution ON ncm_ai_runbook_step_executions(runbook_execution_id);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_runbook_step_executions_step ON ncm_ai_runbook_step_executions(runbook_step_id);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_runbook_step_executions_status ON ncm_ai_runbook_step_executions(step_status);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_runbook_step_executions_ai_log ON ncm_ai_runbook_step_executions(ai_request_log_id);

-- Row Level Security (RLS)
ALTER TABLE ncm_ai_runbook_step_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage AI runbook step executions" ON ncm_ai_runbook_step_executions FOR ALL USING (auth.role() = 'service_role');

-- Timestamp trigger for updated_at
CREATE TRIGGER update_ai_runbook_step_executions_updated_at
  BEFORE UPDATE ON ncm_ai_runbook_step_executions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();