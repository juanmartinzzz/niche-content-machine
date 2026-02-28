-- AI Runbook Steps table for ordered execution within runbooks
-- Each step references a prompt template and optionally takes input from a previous step

CREATE TABLE IF NOT EXISTS ncm_ai_runbook_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relationships
  runbook_id UUID NOT NULL REFERENCES ncm_ai_runbooks(id) ON DELETE CASCADE,
  prompt_template_id UUID REFERENCES ncm_ai_prompt_templates(id) ON DELETE RESTRICT,
  endpoint_id UUID REFERENCES ncm_ai_endpoints(id) ON DELETE RESTRICT,

  -- Step configuration
  step_type VARCHAR(50) DEFAULT 'ai_operation' NOT NULL CHECK (step_type IN ('ai_operation', 'endpoint_call')),
  step_order INTEGER NOT NULL, -- Execution order (1, 2, 3...)
  step_name VARCHAR(255) NOT NULL, -- Human-readable name
  description TEXT,

  -- Simple endpoint configuration (for basic GET/POST requests)
  http_method VARCHAR(10) CHECK (http_method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS')),
  endpoint_url TEXT,

  -- Advanced endpoint configuration (for complex scenarios with headers, body templates, response mapping, etc.)
  -- This JSONB will be used when http_method and endpoint_url are not sufficient
  endpoint_config JSONB,

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

-- Indexes for runbook steps
CREATE INDEX IF NOT EXISTS idx_ncm_ai_runbook_steps_runbook_order ON ncm_ai_runbook_steps(runbook_id, step_order);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_runbook_steps_template ON ncm_ai_runbook_steps(prompt_template_id);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_runbook_steps_endpoint ON ncm_ai_runbook_steps(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_runbook_steps_input_from ON ncm_ai_runbook_steps(input_from_step_id);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_runbook_steps_type ON ncm_ai_runbook_steps(step_type);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_runbook_steps_endpoint_url ON ncm_ai_runbook_steps(endpoint_url) WHERE endpoint_url IS NOT NULL;


-- Row Level Security (RLS)
ALTER TABLE ncm_ai_runbook_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage AI runbook steps" ON ncm_ai_runbook_steps FOR ALL USING (auth.role() = 'service_role');

-- Timestamp trigger for updated_at
CREATE TRIGGER update_ai_runbook_steps_updated_at
  BEFORE UPDATE ON ncm_ai_runbook_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();