-- Migration: Add tool support to AI models and runbook steps
-- Adds supported_tools column to ai_models and enabled_tools column to runbook_steps

-- Add supported_tools column to ai_models table
ALTER TABLE ncm_ai_models
ADD COLUMN supported_tools JSONB DEFAULT '[]'::jsonb;

-- Add enabled_tools column to runbook_steps table
ALTER TABLE ncm_ai_runbook_steps
ADD COLUMN enabled_tools JSONB DEFAULT '{}'::jsonb;

-- Update xAI models to support web_search and x_search
UPDATE ncm_ai_models
SET supported_tools = '["web_search", "x_search"]'::jsonb,
    supports_tools = true
WHERE provider_id = 'ca208ff1-95e0-433b-b348-951b18262939'
  AND model_identifier IN ('grok-4.1-fast-reasoning', 'grok-4.1-fast', 'grok-4-fast-reasoning', 'grok-4-fast', 'grok-4', 'grok-3', 'grok-3-mini');

-- Add comments for documentation
COMMENT ON COLUMN ncm_ai_models.supported_tools IS 'Array of tools supported by this model (e.g., ["web_search", "x_search"])';
COMMENT ON COLUMN ncm_ai_runbook_steps.enabled_tools IS 'Tools enabled for this step (e.g., {"web_search": true, "x_search": false})';