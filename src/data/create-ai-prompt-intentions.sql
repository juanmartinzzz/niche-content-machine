-- Prompt intentions table for structured prompt template sections
-- Stores ordered section-level prompt intentions and prompt section text per template

CREATE TABLE IF NOT EXISTS ncm_ai_prompt_intentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_template_id UUID NOT NULL REFERENCES ncm_ai_prompt_templates(id) ON DELETE CASCADE,
  section_intention VARCHAR(255) NOT NULL,
  section TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Constraints
  UNIQUE(prompt_template_id, position),
  CHECK (char_length(trim(section_intention)) > 0),
  CHECK (char_length(trim(section)) > 0)
);

-- Indexes for prompt intentions
CREATE INDEX IF NOT EXISTS idx_ncm_ai_prompt_intentions_template_position ON ncm_ai_prompt_intentions(prompt_template_id, position);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_prompt_intentions_template ON ncm_ai_prompt_intentions(prompt_template_id);

-- Row Level Security (RLS)
ALTER TABLE ncm_ai_prompt_intentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage AI prompt intentions" ON ncm_ai_prompt_intentions FOR ALL USING (auth.role() = 'service_role');

-- Timestamp trigger for updated_at
CREATE TRIGGER update_ai_prompt_intentions_updated_at
  BEFORE UPDATE ON ncm_ai_prompt_intentions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
