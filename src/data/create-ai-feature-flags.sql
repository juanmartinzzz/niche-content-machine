-- AI Feature Flags table for runtime toggles of API features
-- Enables/disables features like streaming, tool use, vision per environment or user tier

CREATE TABLE IF NOT EXISTS ncm_ai_feature_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Columns for feature flags
  flag_name VARCHAR(100) NOT NULL UNIQUE, -- Flag identifier (e.g. "enable_streaming", "enable_tool_use")
  is_enabled BOOLEAN DEFAULT false NOT NULL, -- Whether the feature is globally enabled
  user_tier_id UUID, -- Optional reference to user tier/role (for per-tier control)
  description TEXT, -- Internal documentation of what this flag controls
  
  -- Timestamps for created_at and updated_at
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for feature flags
CREATE INDEX IF NOT EXISTS idx_ncm_ai_feature_flags_flag_name ON ncm_ai_feature_flags(flag_name);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_feature_flags_enabled ON ncm_ai_feature_flags(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_ncm_ai_feature_flags_user_tier_id ON ncm_ai_feature_flags(user_tier_id);

-- Row Level Security (RLS)
ALTER TABLE ncm_ai_feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage AI feature flags" ON ncm_ai_feature_flags FOR ALL USING (auth.role() = 'service_role');

-- Timestamp trigger for updated_at
CREATE TRIGGER update_ai_feature_flags_updated_at
  BEFORE UPDATE ON ncm_ai_feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();