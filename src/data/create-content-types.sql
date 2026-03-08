-- Content Types table for categorizing different types of content
-- Stores content type definitions that templates can be associated with

CREATE TABLE IF NOT EXISTS ncm_content_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL, -- Code reference key (e.g. "hot-takes", "job-market", "workflow")
  name VARCHAR(100) NOT NULL, -- Human readable name

  -- Timestamps for created_at and updated_at
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for content types
CREATE INDEX IF NOT EXISTS idx_ncm_content_types_slug ON ncm_content_types(slug);

-- Row Level Security (RLS)
ALTER TABLE ncm_content_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage content types" ON ncm_content_types FOR ALL USING (auth.role() = 'service_role');

-- Timestamp trigger for updated_at
CREATE TRIGGER update_content_types_updated_at
  BEFORE UPDATE ON ncm_content_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();