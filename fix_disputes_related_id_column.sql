-- Fix the related_id column in disputes table to accept text instead of UUID
-- This allows users to enter descriptive strings like "My task got rejected" or "TASK-123"

-- First, let's check the current column type
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'disputes' 
AND column_name = 'related_id';

-- Fix the related_id column to accept text
ALTER TABLE public.disputes
ALTER COLUMN related_id TYPE text USING related_id::text;

-- Also fix related_task_id and related_submission_id if they exist and have the same issue
ALTER TABLE public.disputes
ALTER COLUMN related_task_id TYPE text USING related_task_id::text;

ALTER TABLE public.disputes
ALTER COLUMN related_submission_id TYPE text USING related_submission_id::text;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'disputes' 
AND column_name IN ('related_id', 'related_task_id', 'related_submission_id');

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

SELECT 'Disputes related_id column fixed successfully!' as status;


