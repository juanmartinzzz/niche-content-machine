-- Create the ncm_integrations table for managing various integration configurations
CREATE TABLE IF NOT EXISTS ncm_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(100) NOT NULL, -- e.g., "telegram_bot", "discord_bot", "slack_bot", etc.
  name VARCHAR(255) NOT NULL, -- Human-readable name for the integration
  description TEXT, -- Optional description of what this integration does
  config JSONB, -- Integration-specific configuration stored as JSON
  config_schema TEXT, -- JSON Schema describing the structure of the config for UI generation
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ncm_integrations_type ON ncm_integrations(type);
CREATE INDEX IF NOT EXISTS idx_ncm_integrations_active ON ncm_integrations(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE ncm_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role can manage all integrations (for bot configuration, etc.)
CREATE POLICY "Service role can manage integrations" ON ncm_integrations
  FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can view active integrations (for UI rendering)
CREATE POLICY "Authenticated users can view active integrations" ON ncm_integrations
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_ncm_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_ncm_integrations_updated_at
  BEFORE UPDATE ON ncm_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_ncm_integrations_updated_at();