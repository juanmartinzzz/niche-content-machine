-- Templates table for storing content templates with visual styles
-- Each template belongs to one content type and has a visual style label

CREATE TABLE IF NOT EXISTS ncm_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL, -- Code reference key (e.g. "hot-takes", "job-market", "workflow")
  content_type_id UUID REFERENCES ncm_content_types(id) ON DELETE CASCADE, -- Template belongs to one content type
  
  name VARCHAR(100) NOT NULL, -- Template name
  visual_style VARCHAR(20) NOT NULL CHECK (visual_style IN ('minimal', 'bold', 'modern', 'classic', 'clean')), -- Visual style label


  html_template TEXT, -- Optional HTML template for the template

  description TEXT, -- Optional description of the template
  width_pixels INTEGER, -- Optional width in pixels for template dimensions
  height_pixels INTEGER, -- Optional height in pixels for template dimensions

  -- Timestamps for created_at and updated_at
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for templates
CREATE INDEX IF NOT EXISTS idx_ncm_templates_slug ON ncm_templates(slug);
CREATE INDEX IF NOT EXISTS idx_ncm_templates_content_type ON ncm_templates(content_type_id);
CREATE INDEX IF NOT EXISTS idx_ncm_templates_visual_style ON ncm_templates(visual_style);

-- Row Level Security (RLS)
ALTER TABLE ncm_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage templates" ON ncm_templates FOR ALL USING (auth.role() = 'service_role');

-- Timestamp trigger for updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON ncm_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();