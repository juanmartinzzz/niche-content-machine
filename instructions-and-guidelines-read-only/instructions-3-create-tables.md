# Table Creation SQL Template

> **Note:** All table prefixes use `ncm_` directly (previously `${SUPABASE_TABLE_PREFIX}` was replaced with this value).

Every table creation `.sql` file must contain these core components:

## 1. CREATE TABLE Statement

```sql
CREATE TABLE IF NOT EXISTS ncm_your_table_name (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- your columns here
  
  -- Timestamps for created_at and updated_at
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

## 2. Indexes for Search and Sorting Optimization

Add indexes for frequently queried columns to improve performance:

```sql
-- Index for sorting by creation date (common for feeds/timelines)
CREATE INDEX IF NOT EXISTS idx_ncm_your_table_name_created_at ON ncm_your_table_name(created_at DESC);

-- Index for user-specific queries (if you have user_id column)
CREATE INDEX IF NOT EXISTS idx_ncm_your_table_name_user_id ON ncm_your_table_name(user_id);

-- Composite index for user + date queries (powerful for personalized feeds)
CREATE INDEX IF NOT EXISTS idx_ncm_your_table_name_user_created ON ncm_your_table_name(user_id, created_at DESC);

-- Add more indexes based on your specific search/sort patterns:
-- CREATE INDEX IF NOT EXISTS idx_ncm_your_table_name_status
--   ON ncm_your_table_name(status);
```

## 3. Row Level Security (RLS)

```sql
ALTER TABLE ncm_your_table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own records" ON ncm_your_table_name FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" ON ncm_your_table_name FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" ON ncm_your_table_name FOR UPDATE USING (auth.uid() = user_id);
```

## 4. Timestamp Triggers

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_your_table_name_updated_at
  BEFORE UPDATE ON ncm_your_table_name
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```