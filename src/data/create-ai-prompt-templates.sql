-- AI Prompt Templates table for versioned system and user prompts
-- Stores prompt templates that can be looked up by slug and versioned for A/B testing

CREATE TABLE IF NOT EXISTS ncm_ai_prompt_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Columns for prompt templates
  name VARCHAR(100) NOT NULL, -- Name of the prompt template
  endpoint_id UUID REFERENCES ncm_ai_endpoints(id) ON DELETE SET NULL, -- Optional link to specific endpoint
  system_prompt TEXT, -- System prompt text (can be null if only user prompt)
  user_prompt_template TEXT, -- User prompt with placeholder variables (e.g. "{{document_text}}")
  version INTEGER NOT NULL DEFAULT 1, -- Version number for this template
  is_active BOOLEAN DEFAULT false NOT NULL, -- Whether this is the active version
  description TEXT, -- Optional description of what this template does

  -- Timestamps for created_at and updated_at
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Unique constraint for name + version combination
  UNIQUE(name, version)
);

-- Indexes for prompt templates
CREATE INDEX IF NOT EXISTS idx_ncm_ai_prompt_templates_slug_active ON ncm_ai_prompt_templates(slug, is_active DESC, version DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ncm_ai_prompt_templates_slug ON ncm_ai_prompt_templates(slug, version DESC);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_prompt_templates_endpoint_id ON ncm_ai_prompt_templates(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_prompt_templates_active ON ncm_ai_prompt_templates(is_active) WHERE is_active = true;

-- Row Level Security (RLS)
ALTER TABLE ncm_ai_prompt_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage AI prompt templates" ON ncm_ai_prompt_templates FOR ALL USING (auth.role() = 'service_role');

-- Timestamp trigger for updated_at
CREATE TRIGGER update_ai_prompt_templates_updated_at
  BEFORE UPDATE ON ncm_ai_prompt_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();