-- Add missing resolution tracking columns to disputes table
-- This ensures admin resolution notes are properly saved and visible to users

-- Add resolved_by column (UUID reference to admin who resolved)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'disputes' 
        AND column_name = 'resolved_by'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.disputes ADD COLUMN resolved_by uuid;
        COMMENT ON COLUMN public.disputes.resolved_by IS 'Admin user ID who resolved this dispute';
    END IF;
END $$;

-- Add resolved_at column (timestamp when dispute was resolved)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'disputes' 
        AND column_name = 'resolved_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.disputes ADD COLUMN resolved_at timestamp with time zone;
        COMMENT ON COLUMN public.disputes.resolved_at IS 'Timestamp when dispute was resolved';
    END IF;
END $$;

-- Add resolution_notes column (admin notes visible to users)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'disputes' 
        AND column_name = 'resolution_notes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.disputes ADD COLUMN resolution_notes text;
        COMMENT ON COLUMN public.disputes.resolution_notes IS 'Admin resolution notes visible to both parties';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'disputes' 
AND table_schema = 'public'
AND column_name IN ('resolved_by', 'resolved_at', 'resolution_notes')
ORDER BY column_name;

-- Test insert to make sure it works
INSERT INTO public.disputes (
    dispute_id,
    dispute_type,
    title,
    description,
    status,
    raised_by,
    resolution_notes,
    resolved_by,
    resolved_at
) VALUES (
    'TEST_' || extract(epoch from now())::text,
    'other',
    'Test Resolution',
    'Testing resolution notes functionality',
    'resolved',
    auth.uid(),
    'This is a test resolution note that should be visible to users.',
    auth.uid(),
    now()
) ON CONFLICT DO NOTHING;

-- Clean up test record
DELETE FROM public.disputes 
WHERE dispute_id LIKE 'TEST_%';

SELECT 'Resolution columns added successfully to disputes table!' as status;

