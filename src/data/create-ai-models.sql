-- AI Models table for managing individual model versions and their capabilities
-- Each row represents a specific model version available from a provider

CREATE TABLE IF NOT EXISTS ncm_ai_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Columns for models
  provider_id UUID NOT NULL REFERENCES ncm_ai_providers(id) ON DELETE CASCADE,
  model_identifier VARCHAR(255) NOT NULL, -- Exact API model identifier (e.g. "grok-3")
  display_name VARCHAR(255) NOT NULL, -- Friendly display name
  context_window_tokens INTEGER, -- Model's context window size in tokens
  max_output_tokens INTEGER, -- Maximum output tokens allowed
  supports_vision BOOLEAN DEFAULT false, -- Whether model supports vision/image inputs
  supports_tools BOOLEAN DEFAULT false, -- Whether model supports function/tool calling
  input_cost_per_million_tokens DECIMAL(10,6), -- Input cost in millionths of a dollar
  output_cost_per_million_tokens DECIMAL(10,6), -- Output cost in millionths of a dollar
  is_enabled BOOLEAN DEFAULT true NOT NULL, -- Whether model is currently enabled in app
  deprecated_at TIMESTAMP WITH TIME ZONE, -- Deprecation date if applicable
  
  -- Timestamps for created_at and updated_at
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Ensure unique model identifier per provider
  UNIQUE(provider_id, model_identifier)
);

-- Indexes for models
CREATE INDEX IF NOT EXISTS idx_ncm_ai_models_provider_id ON ncm_ai_models(provider_id);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_models_is_enabled ON ncm_ai_models(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_ncm_ai_models_identifier ON ncm_ai_models(model_identifier);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_models_provider_enabled ON ncm_ai_models(provider_id, is_enabled);

-- Row Level Security (RLS)
ALTER TABLE ncm_ai_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage AI models" ON ncm_ai_models FOR ALL USING (auth.role() = 'service_role');

-- Timestamp trigger for updated_at
CREATE TRIGGER update_ai_models_updated_at
  BEFORE UPDATE ON ncm_ai_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();