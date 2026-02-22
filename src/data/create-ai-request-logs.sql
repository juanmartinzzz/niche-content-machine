-- AI Request Logs table for full audit log of every API call with token usage and cost
-- Provides auditability, cost tracking, and debugging capability

CREATE TABLE IF NOT EXISTS ncm_ai_request_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Columns for request logs
  endpoint_id UUID REFERENCES ncm_ai_endpoints(id) ON DELETE SET NULL,
  user_id UUID, -- Reference to user who triggered the request (nullable for anonymous)
  session_id VARCHAR(255), -- Session identifier for grouping related requests
  request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  response_timestamp TIMESTAMP WITH TIME ZONE,
  http_status_code INTEGER, -- HTTP status code returned by API
  prompt_tokens INTEGER DEFAULT 0, -- Input tokens used
  completion_tokens INTEGER DEFAULT 0, -- Output tokens generated
  total_tokens INTEGER DEFAULT 0, -- Total tokens used
  estimated_cost_usd DECIMAL(10,6), -- Estimated cost in USD (computed from model rates)
  request_success BOOLEAN, -- Whether the request succeeded
  error_message TEXT, -- Error message if request failed
  request_payload_hash VARCHAR(64), -- Hashed version of request payload for debugging
  
  -- Timestamps for created_at and updated_at
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for request logs
CREATE INDEX IF NOT EXISTS idx_ncm_ai_request_logs_request_timestamp ON ncm_ai_request_logs(request_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_request_logs_user_id ON ncm_ai_request_logs(user_id, request_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_request_logs_endpoint_id ON ncm_ai_request_logs(endpoint_id, request_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_request_logs_session_id ON ncm_ai_request_logs(session_id, request_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ncm_ai_request_logs_success ON ncm_ai_request_logs(request_success) WHERE request_success = false;
CREATE INDEX IF NOT EXISTS idx_ncm_ai_request_logs_cost ON ncm_ai_request_logs(estimated_cost_usd DESC);

-- Row Level Security (RLS)
ALTER TABLE ncm_ai_request_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage AI request logs" ON ncm_ai_request_logs FOR ALL USING (auth.role() = 'service_role');

-- Timestamp trigger for updated_at
CREATE TRIGGER update_ai_request_logs_updated_at
  BEFORE UPDATE ON ncm_ai_request_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();