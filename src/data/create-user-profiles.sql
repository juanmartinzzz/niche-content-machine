-- User profiles table extending Supabase auth.users
-- Uses SUPABASE_TABLE_PREFIX environment variable for table naming
CREATE TABLE IF NOT EXISTS ncm_user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Columns for user profiles
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  company TEXT,
  job_title TEXT,
  timezone TEXT DEFAULT 'UTC',
  preferences JSONB DEFAULT '{}',
  is_profile_complete BOOLEAN DEFAULT FALSE,
  
  -- Timestamps for created_at and updated_at
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for user profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON ncm_user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON ncm_user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON ncm_user_profiles(updated_at);

-- Row Level Security (RLS) policies
ALTER TABLE ncm_user_profiles ENABLE ROW LEVEL SECURITY;
-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON ncm_user_profiles FOR UPDATE USING (auth.uid() = id);
-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON ncm_user_profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on profile changes
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON ncm_user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup (optional - can be called from auth triggers)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ncm_user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup (optional)
-- Uncomment the following lines if you want automatic profile creation:
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();