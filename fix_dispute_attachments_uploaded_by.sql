-- Fix the uploaded_by column in dispute_attachments table
-- This ensures the column exists and has proper constraints

-- Check current structure of dispute_attachments table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'dispute_attachments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add uploaded_by column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dispute_attachments' 
        AND column_name = 'uploaded_by'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.dispute_attachments ADD COLUMN uploaded_by uuid;
    END IF;
END $$;

-- Make uploaded_by nullable if it's currently NOT NULL (to avoid constraint issues)
ALTER TABLE public.dispute_attachments 
ALTER COLUMN uploaded_by DROP NOT NULL;

-- Add a default value that references the user who uploaded the file
-- This will be set by the application, but we provide a fallback
ALTER TABLE public.dispute_attachments 
ALTER COLUMN uploaded_by SET DEFAULT auth.uid();

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'dispute_attachments' 
AND table_schema = 'public'
AND column_name = 'uploaded_by';

-- Test insert to make sure it works
INSERT INTO public.dispute_attachments (
    dispute_id,
    file_name,
    file_path,
    file_size,
    mime_type,
    uploaded_by
) VALUES (
    (SELECT id FROM public.disputes LIMIT 1),
    'test_file.pdf',
    'test/path/test_file.pdf',
    1024,
    'application/pdf',
    auth.uid()
) ON CONFLICT DO NOTHING;

-- Clean up test record
DELETE FROM public.dispute_attachments 
WHERE file_name = 'test_file.pdf';

SELECT 'uploaded_by column in dispute_attachments table has been fixed!' as status;


