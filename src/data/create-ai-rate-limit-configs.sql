-- AI Rate Limit Configs table for per-model rate limit thresholds and backoff strategies
-- Stores rate limits that vary by tier and model for throttling logic

CREATE TABLE IF NOT EXISTS ncm_ai_rate_limit_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Columns for rate limit configs
  model_id UUID NOT NULL REFERENCES ncm_ai_models(id) ON DELETE CASCADE,
  requests_per_minute INTEGER, -- Requests per minute allowed by API
  tokens_per_minute INTEGER, -- Tokens per minute allowed by API
  requests_per_day INTEGER, -- Requests per day allowed by API
  enforce_internal_limit BOOLEAN DEFAULT false, -- Whether to use lower internal limits than API limits
  internal_requests_per_minute INTEGER, -- Internal request limit (if enforce_internal_limit=true)
  internal_tokens_per_minute INTEGER, -- Internal token limit (if enforce_internal_limit=true)
  backoff_strategy VARCHAR(20) DEFAULT 'exponential' NOT NULL, -- Strategy for 429 errors: 'exponential', 'fixed', 'linear'
  backoff_base_delay_ms INTEGER DEFAULT 1000, -- Base delay in milliseconds for backoff
  max_backoff_delay_ms INTEGER DEFAULT 30000, -- Maximum backoff delay in milliseconds
  
  -- Timestamps for created_at and updated_at
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- One config per model
  UNIQUE(model_id)
);

-- Indexes for rate limit configs
CREATE INDEX IF NOT EXISTS idx_ncm_ai_rate_limit_configs_model_id ON ncm_ai_rate_limit_configs(model_id);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_rate_limit_configs_internal_limits ON ncm_ai_rate_limit_configs(enforce_internal_limit) WHERE enforce_internal_limit = true;

-- Row Level Security (RLS)
ALTER TABLE ncm_ai_rate_limit_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage AI rate limit configs" ON ncm_ai_rate_limit_configs FOR ALL USING (auth.role() = 'service_role');

-- Timestamp trigger for updated_at
CREATE TRIGGER update_ai_rate_limit_configs_updated_at
  BEFORE UPDATE ON ncm_ai_rate_limit_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();