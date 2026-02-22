-- AI Endpoints table for mapping app features to models and call parameters
-- Each row represents a specific capability/feature mapped to a model with default parameters

CREATE TABLE IF NOT EXISTS ncm_ai_endpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Columns for endpoints
  slug VARCHAR(100) NOT NULL UNIQUE, -- Code reference key (e.g. "chat_completion", "document_summary")
  model_id UUID NOT NULL REFERENCES ncm_ai_models(id) ON DELETE RESTRICT,
  api_path VARCHAR(255) NOT NULL, -- API path to call (e.g. "/chat/completions")
  http_method VARCHAR(10) DEFAULT 'POST' NOT NULL, -- HTTP method (GET, POST, etc.)
  default_temperature DECIMAL(3,2) DEFAULT 0.7, -- Default temperature setting (0.0-2.0)
  default_max_tokens INTEGER, -- Default maximum tokens to generate
  default_top_p DECIMAL(3,2) DEFAULT 1.0, -- Default top-p sampling parameter
  supports_streaming BOOLEAN DEFAULT false, -- Whether streaming responses are enabled
  is_active BOOLEAN DEFAULT true NOT NULL, -- Whether this endpoint is currently active
  description TEXT, -- Optional description of what this endpoint does
  
  -- Timestamps for created_at and updated_at
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for endpoints
CREATE INDEX IF NOT EXISTS idx_ncm_ai_endpoints_slug
  ON ncm_ai_endpoints(slug);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_endpoints_is_active ON ncm_ai_endpoints(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ncm_ai_endpoints_model_id ON ncm_ai_endpoints(model_id);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_endpoints_model_active ON ncm_ai_endpoints(model_id, is_active);

-- Row Level Security (RLS)
ALTER TABLE ncm_ai_endpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage AI endpoints" ON ncm_ai_endpoints FOR ALL USING (auth.role() = 'service_role');

-- Timestamp trigger for updated_at
CREATE TRIGGER update_ai_endpoints_updated_at
  BEFORE UPDATE ON ncm_ai_endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();