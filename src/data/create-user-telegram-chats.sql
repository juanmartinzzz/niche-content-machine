-- Create the ncm_user_telegram_chats table for managing user Telegram chat connections
CREATE TABLE IF NOT EXISTS ncm_user_telegram_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES ncm_user_profiles(id) ON DELETE CASCADE,
  chat_id VARCHAR(100) NOT NULL, -- Telegram chat identifier (can be numeric or string)
  chat_title VARCHAR(255), -- Optional human-readable name for the chat
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  -- Ensure unique chat_id per user
  UNIQUE(user_id, chat_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_telegram_chats_user_id ON ncm_user_telegram_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_telegram_chats_chat_id ON ncm_user_telegram_chats(chat_id);
CREATE INDEX IF NOT EXISTS idx_user_telegram_chats_active ON ncm_user_telegram_chats(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE ncm_user_telegram_chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own telegram chats
CREATE POLICY "Users can view own telegram chats" ON ncm_user_telegram_chats
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own telegram chats
CREATE POLICY "Users can insert own telegram chats" ON ncm_user_telegram_chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own telegram chats
CREATE POLICY "Users can update own telegram chats" ON ncm_user_telegram_chats
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own telegram chats
CREATE POLICY "Users can delete own telegram chats" ON ncm_user_telegram_chats
  FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_ncm_user_telegram_chats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_ncm_user_telegram_chats_updated_at
  BEFORE UPDATE ON ncm_user_telegram_chats
  FOR EACH ROW
  EXECUTE FUNCTION update_ncm_user_telegram_chats_updated_at();