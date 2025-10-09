-- Fix disputes table structure to match the frontend expectations
-- This script will add missing columns or update existing ones

-- First, let's check what columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'disputes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
-- related_id column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'disputes' 
        AND column_name = 'related_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.disputes ADD COLUMN related_id text;
    END IF;
END $$;

-- related_task_id column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'disputes' 
        AND column_name = 'related_task_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.disputes ADD COLUMN related_task_id text;
    END IF;
END $$;

-- related_submission_id column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'disputes' 
        AND column_name = 'related_submission_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.disputes ADD COLUMN related_submission_id text;
    END IF;
END $$;

-- Make sure all text columns are properly typed
ALTER TABLE public.disputes 
ALTER COLUMN related_id TYPE text USING COALESCE(related_id::text, '');

ALTER TABLE public.disputes 
ALTER COLUMN related_task_id TYPE text USING COALESCE(related_task_id::text, '');

ALTER TABLE public.disputes 
ALTER COLUMN related_submission_id TYPE text USING COALESCE(related_submission_id::text, '');

-- Verify the final structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'disputes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test insert to make sure it works
INSERT INTO public.disputes (
    dispute_type,
    title,
    description,
    raised_by,
    related_id,
    status,
    priority
) VALUES (
    'payment',
    'Test Dispute',
    'This is a test dispute to verify the fix',
    auth.uid(),
    'My task got rejected - this should work now',
    'open',
    'medium'
) ON CONFLICT DO NOTHING;

-- Clean up the test record
DELETE FROM public.disputes 
WHERE description = 'This is a test dispute to verify the fix';

SELECT 'Disputes table structure fixed successfully!' as status;


