-- AI Providers table for managing AI provider configurations
-- This table acts as a registry of AI providers (Grok, etc.) and their base configurations

CREATE TABLE IF NOT EXISTS ncm_ai_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE, -- Human-readable name (e.g. "xAI Grok")
  
  base_url TEXT NOT NULL, -- Base API URL (e.g. "https://api.x.ai/v1")
  is_active BOOLEAN DEFAULT true NOT NULL, -- Whether the provider is currently enabled
  global_timeout_seconds INTEGER DEFAULT 30, -- Global timeout for all calls to this provider
  max_retries INTEGER DEFAULT 3, -- Global retry limit for failed requests
  notes TEXT, -- Internal documentation/notes field
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for providers
CREATE INDEX IF NOT EXISTS idx_ncm_ai_providers_is_active ON ncm_ai_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_providers_name ON ncm_ai_providers(name);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_providers_created_at ON ncm_ai_providers(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE ncm_ai_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage AI providers" ON ncm_ai_providers FOR ALL USING (auth.role() = 'service_role');

-- Timestamp trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_providers_updated_at
  BEFORE UPDATE ON ncm_ai_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();