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