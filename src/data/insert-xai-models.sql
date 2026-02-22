-- xAI Grok Models INSERT statements
-- Provider ID: ca208ff1-95e0-433b-b348-951b18262939
-- Based on x.ai documentation and pricing as of 2026

-- Grok 4.1 Fast (reasoning variant)
INSERT INTO ncm_ai_models (
  provider_id,
  model_identifier,
  display_name,
  context_window_tokens,
  max_output_tokens,
  supports_vision,
  supports_tools,
  input_cost_per_million_tokens,
  output_cost_per_million_tokens,
  is_enabled
) VALUES (
  'ca208ff1-95e0-433b-b348-951b18262939',
  'grok-4.1-fast-reasoning',
  'Grok 4.1 Fast (Reasoning)',
  2000000,
  131072,
  true,
  true,
  0.20,
  0.50,
  true
);

-- Grok 4.1 Fast (non-reasoning variant)
INSERT INTO ncm_ai_models (
  provider_id,
  model_identifier,
  display_name,
  context_window_tokens,
  max_output_tokens,
  supports_vision,
  supports_tools,
  input_cost_per_million_tokens,
  output_cost_per_million_tokens,
  is_enabled
) VALUES (
  'ca208ff1-95e0-433b-b348-951b18262939',
  'grok-4.1-fast',
  'Grok 4.1 Fast',
  2000000,
  131072,
  true,
  true,
  0.20,
  0.50,
  true
);

-- Grok 4 Fast (reasoning variant)
INSERT INTO ncm_ai_models (
  provider_id,
  model_identifier,
  display_name,
  context_window_tokens,
  max_output_tokens,
  supports_vision,
  supports_tools,
  input_cost_per_million_tokens,
  output_cost_per_million_tokens,
  is_enabled
) VALUES (
  'ca208ff1-95e0-433b-b348-951b18262939',
  'grok-4-fast-reasoning',
  'Grok 4 Fast (Reasoning)',
  2000000,
  131072,
  true,
  true,
  0.20,
  0.50,
  true
);

-- Grok 4 Fast (non-reasoning variant)
INSERT INTO ncm_ai_models (
  provider_id,
  model_identifier,
  display_name,
  context_window_tokens,
  max_output_tokens,
  supports_vision,
  supports_tools,
  input_cost_per_million_tokens,
  output_cost_per_million_tokens,
  is_enabled
) VALUES (
  'ca208ff1-95e0-433b-b348-951b18262939',
  'grok-4-fast',
  'Grok 4 Fast',
  2000000,
  131072,
  true,
  true,
  0.20,
  0.50,
  true
);

-- Grok Code Fast 1
INSERT INTO ncm_ai_models (
  provider_id,
  model_identifier,
  display_name,
  context_window_tokens,
  max_output_tokens,
  supports_vision,
  supports_tools,
  input_cost_per_million_tokens,
  output_cost_per_million_tokens,
  is_enabled
) VALUES (
  'ca208ff1-95e0-433b-b348-951b18262939',
  'grok-code-fast-1',
  'Grok Code Fast 1',
  256000,
  131072,
  false,
  true,
  0.20,
  1.50,
  true
);

-- Grok 4 (flagship model)
INSERT INTO ncm_ai_models (
  provider_id,
  model_identifier,
  display_name,
  context_window_tokens,
  max_output_tokens,
  supports_vision,
  supports_tools,
  input_cost_per_million_tokens,
  output_cost_per_million_tokens,
  is_enabled
) VALUES (
  'ca208ff1-95e0-433b-b348-951b18262939',
  'grok-4',
  'Grok 4',
  256000,
  131072,
  true,
  true,
  3.00,
  15.00,
  true
);

-- Grok 3
INSERT INTO ncm_ai_models (
  provider_id,
  model_identifier,
  display_name,
  context_window_tokens,
  max_output_tokens,
  supports_vision,
  supports_tools,
  input_cost_per_million_tokens,
  output_cost_per_million_tokens,
  is_enabled
) VALUES (
  'ca208ff1-95e0-433b-b348-951b18262939',
  'grok-3',
  'Grok 3',
  131000,
  131072,
  true,
  true,
  3.00,
  15.00,
  true
);

-- Grok 3 Mini
INSERT INTO ncm_ai_models (
  provider_id,
  model_identifier,
  display_name,
  context_window_tokens,
  max_output_tokens,
  supports_vision,
  supports_tools,
  input_cost_per_million_tokens,
  output_cost_per_million_tokens,
  is_enabled
) VALUES (
  'ca208ff1-95e0-433b-b348-951b18262939',
  'grok-3-mini',
  'Grok 3 Mini',
  131000,
  131072,
  false,
  true,
  0.30,
  0.50,
  true
);

-- Image Generation Models
-- Note: These models have per-image pricing, not per-token pricing

-- Grok Imagine Image (Standard)
INSERT INTO ncm_ai_models (
  provider_id,
  model_identifier,
  display_name,
  context_window_tokens,
  max_output_tokens,
  supports_vision,
  supports_tools,
  input_cost_per_million_tokens,
  output_cost_per_million_tokens,
  is_enabled
) VALUES (
  'ca208ff1-95e0-433b-b348-951b18262939',
  'grok-imagine-image',
  'Grok Imagine Image',
  null,
  null,
  false,
  false,
  null, -- $0.02 per image (not per million tokens)
  null, -- $0.02 per image (not per million tokens)
  true
);

-- Grok Imagine Image Pro (High Quality)
INSERT INTO ncm_ai_models (
  provider_id,
  model_identifier,
  display_name,
  context_window_tokens,
  max_output_tokens,
  supports_vision,
  supports_tools,
  input_cost_per_million_tokens,
  output_cost_per_million_tokens,
  is_enabled
) VALUES (
  'ca208ff1-95e0-433b-b348-951b18262939',
  'grok-imagine-image-pro',
  'Grok Imagine Image Pro',
  null,
  null,
  false,
  false,
  null, -- $0.07 per image (not per million tokens)
  null, -- $0.07 per image (not per million tokens)
  true
);

-- Video Generation Model
-- Note: This model has per-second pricing, not per-token pricing

-- Grok Imagine Video
INSERT INTO ncm_ai_models (
  provider_id,
  model_identifier,
  display_name,
  context_window_tokens,
  max_output_tokens,
  supports_vision,
  supports_tools,
  input_cost_per_million_tokens,
  output_cost_per_million_tokens,
  is_enabled
) VALUES (
  'ca208ff1-95e0-433b-b348-951b18262939',
  'grok-imagine-video',
  'Grok Imagine Video',
  null,
  null,
  false,
  false,
  null, -- $0.050 per second (not per million tokens)
  null, -- $0.050 per second (not per million tokens)
  true
);