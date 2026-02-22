-- AI Fallback Chains table for ordered model fallback sequences for resilience
-- Defines chains that specify fallback models when primary models are unavailable

CREATE TABLE IF NOT EXISTS ncm_ai_fallback_chains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Columns for fallback chains
  name VARCHAR(255) NOT NULL UNIQUE, -- Name for the fallback chain
  trigger_condition VARCHAR(50) NOT NULL, -- When to trigger fallback: 'on_error', 'on_rate_limit', 'on_cost_exceeded'
  is_active BOOLEAN DEFAULT true NOT NULL, -- Whether this chain is currently active
  description TEXT, -- Optional description of when/how to use this chain
  
  -- Timestamps for created_at and updated_at
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- AI Fallback Chain Models table for ordered model references within chains
-- Stores the priority-ordered list of models to try in sequence
CREATE TABLE IF NOT EXISTS ncm_ai_fallback_chain_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Columns for fallback chain models
  chain_id UUID NOT NULL REFERENCES ncm_ai_fallback_chains(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES ncm_ai_models(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL, -- Priority order (1 = first, 2 = second, etc.)
  
  -- Timestamps for created_at and updated_at
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Ensure unique priority per chain and unique model per chain
  UNIQUE(chain_id, priority),
  UNIQUE(chain_id, model_id)
);

-- Indexes for fallback chains
CREATE INDEX IF NOT EXISTS idx_ncm_ai_fallback_chains_name ON ncm_ai_fallback_chains(name);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_fallback_chains_is_active ON ncm_ai_fallback_chains(is_active) WHERE is_active = true;

-- Indexes for fallback chain models
CREATE INDEX IF NOT EXISTS idx_ncm_ai_fallback_chain_models_chain_priority ON ncm_ai_fallback_chain_models(chain_id, priority);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_fallback_chain_models_model_id ON ncm_ai_fallback_chain_models(model_id);

-- Row Level Security (RLS) for ai_fallback_chains
ALTER TABLE ncm_ai_fallback_chains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage AI fallback chains" ON ncm_ai_fallback_chains FOR ALL USING (auth.role() = 'service_role');

-- Row Level Security (RLS) for ai_fallback_chain_models
ALTER TABLE ncm_ai_fallback_chain_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage AI fallback chain models" ON ncm_ai_fallback_chain_models FOR ALL USING (auth.role() = 'service_role');

-- Timestamp triggers for updated_at
CREATE TRIGGER update_ai_fallback_chains_updated_at
  BEFORE UPDATE ON ncm_ai_fallback_chains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_fallback_chain_models_updated_at
  BEFORE UPDATE ON ncm_ai_fallback_chain_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();