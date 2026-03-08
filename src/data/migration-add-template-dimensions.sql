-- Migration to add width_pixels and height_pixels columns to ncm_templates table
-- Safe to run multiple times (idempotent)

-- Add width_pixels column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ncm_templates'
        AND column_name = 'width_pixels'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE ncm_templates ADD COLUMN width_pixels INTEGER;
        RAISE NOTICE 'Added width_pixels column to ncm_templates';
    ELSE
        RAISE NOTICE 'width_pixels column already exists in ncm_templates';
    END IF;
END $$;

-- Add height_pixels column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ncm_templates'
        AND column_name = 'height_pixels'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE ncm_templates ADD COLUMN height_pixels INTEGER;
        RAISE NOTICE 'Added height_pixels column to ncm_templates';
    ELSE
        RAISE NOTICE 'height_pixels column already exists in ncm_templates';
    END IF;
END $$;