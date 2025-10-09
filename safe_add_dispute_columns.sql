-- Safe script to add missing dispute resolution columns
-- This script will NOT disturb existing data and only adds columns if they don't exist

-- Check current structure first
SELECT 'Current disputes table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'disputes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns only if they don't exist
DO $$ 
BEGIN
    -- Add resolved_by column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'disputes' 
        AND column_name = 'resolved_by'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.disputes ADD COLUMN resolved_by uuid;
        RAISE NOTICE 'Added resolved_by column';
    ELSE
        RAISE NOTICE 'resolved_by column already exists - skipped';
    END IF;
    
    -- Add resolved_at column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'disputes' 
        AND column_name = 'resolved_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.disputes ADD COLUMN resolved_at timestamp with time zone;
        RAISE NOTICE 'Added resolved_at column';
    ELSE
        RAISE NOTICE 'resolved_at column already exists - skipped';
    END IF;
    
    -- Add resolution_notes column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'disputes' 
        AND column_name = 'resolution_notes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.disputes ADD COLUMN resolution_notes text;
        RAISE NOTICE 'Added resolution_notes column';
    ELSE
        RAISE NOTICE 'resolution_notes column already exists - skipped';
    END IF;
    
    -- Add admin_notes column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'disputes' 
        AND column_name = 'admin_notes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.disputes ADD COLUMN admin_notes text;
        RAISE NOTICE 'Added admin_notes column';
    ELSE
        RAISE NOTICE 'admin_notes column already exists - skipped';
    END IF;
    
    -- Add against column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'disputes' 
        AND column_name = 'against'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.disputes ADD COLUMN against uuid;
        RAISE NOTICE 'Added against column';
    ELSE
        RAISE NOTICE 'against column already exists - skipped';
    END IF;
    
    -- Add related_id column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'disputes' 
        AND column_name = 'related_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.disputes ADD COLUMN related_id text;
        RAISE NOTICE 'Added related_id column';
    ELSE
        RAISE NOTICE 'related_id column already exists - skipped';
    END IF;
    
END $$;

-- Verify the final structure
SELECT 'Final disputes table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'disputes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if all required columns exist
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'disputes' AND column_name = 'resolved_by'
  ) THEN '✅ resolved_by EXISTS' ELSE '❌ resolved_by MISSING' END as resolved_by_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'disputes' AND column_name = 'resolved_at'
  ) THEN '✅ resolved_at EXISTS' ELSE '❌ resolved_at MISSING' END as resolved_at_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'disputes' AND column_name = 'resolution_notes'
  ) THEN '✅ resolution_notes EXISTS' ELSE '❌ resolution_notes MISSING' END as resolution_notes_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'disputes' AND column_name = 'admin_notes'
  ) THEN '✅ admin_notes EXISTS' ELSE '❌ admin_notes MISSING' END as admin_notes_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'disputes' AND column_name = 'against'
  ) THEN '✅ against EXISTS' ELSE '❌ against MISSING' END as against_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'disputes' AND column_name = 'related_id'
  ) THEN '✅ related_id EXISTS' ELSE '❌ related_id MISSING' END as related_id_status;

SELECT '✅ Safe script completed! No existing data was disturbed.' as final_status;

