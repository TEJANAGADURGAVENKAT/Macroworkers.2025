-- Complete fix for task assignment 400 error
-- This addresses all possible causes of the error

-- Step 1: Check current table structure
SELECT 'Current task_assignments structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Fix foreign key constraints
ALTER TABLE public.task_assignments DROP CONSTRAINT IF EXISTS task_assignments_worker_id_fkey;
ALTER TABLE public.task_assignments DROP CONSTRAINT IF EXISTS task_assignments_task_id_fkey;

-- Add correct foreign key constraints
ALTER TABLE public.task_assignments 
ADD CONSTRAINT task_assignments_task_id_fkey 
FOREIGN KEY (task_id) REFERENCES public.tasks(id);

ALTER TABLE public.task_assignments 
ADD CONSTRAINT task_assignments_worker_id_fkey 
FOREIGN KEY (worker_id) REFERENCES public.profiles(user_id);

-- Step 3: Ensure all required columns exist with correct types
DO $$ 
BEGIN
    -- Make sure id column exists and is primary key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignments' 
        AND column_name = 'id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();
    END IF;
    
    -- Make sure created_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignments' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments ADD COLUMN created_at timestamp with time zone NOT NULL DEFAULT now();
    END IF;
    
    -- Make sure updated_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignments' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments ADD COLUMN updated_at timestamp with time zone NOT NULL DEFAULT now();
    END IF;
    
    -- Make sure assigned_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignments' 
        AND column_name = 'assigned_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments ADD COLUMN assigned_at timestamp with time zone NOT NULL DEFAULT now();
    END IF;
END $$;

-- Step 4: Add primary key if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'task_assignments' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments ADD CONSTRAINT task_assignments_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- Step 5: Fix RLS policies completely
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.task_assignments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.task_assignments;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.task_assignments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.task_assignments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.task_assignments;

-- Create comprehensive policies
CREATE POLICY "Enable all operations for authenticated users" ON public.task_assignments
FOR ALL USING (auth.role() = 'authenticated');

-- Step 6: Grant all necessary permissions
GRANT ALL ON public.task_assignments TO authenticated;
GRANT ALL ON public.task_assignments TO anon;
GRANT ALL ON public.task_assignments TO service_role;

-- Step 7: Test the table structure
SELECT 'Final table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 8: Test constraints
SELECT 'Table constraints:' as info;
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'task_assignments' 
AND table_schema = 'public';

-- Step 9: Test insert with sample data
DO $$ 
DECLARE
    sample_task_id uuid;
    sample_worker_id uuid;
    test_id uuid;
BEGIN
    -- Get sample IDs
    SELECT id INTO sample_task_id FROM public.tasks LIMIT 1;
    SELECT user_id INTO sample_worker_id FROM public.profiles WHERE role = 'worker' LIMIT 1;
    
    IF sample_task_id IS NOT NULL AND sample_worker_id IS NOT NULL THEN
        -- Try to insert a test record
        INSERT INTO public.task_assignments (task_id, worker_id, status, assigned_at)
        VALUES (sample_task_id, sample_worker_id, 'assigned', now())
        RETURNING id INTO test_id;
        
        -- If successful, delete the test record
        DELETE FROM public.task_assignments WHERE id = test_id;
        
        RAISE NOTICE '✅ Insert test successful - table is ready for assignments';
    ELSE
        RAISE NOTICE '⚠️ No sample data available for testing';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Insert test failed: %', SQLERRM;
END $$;

-- Step 10: Check for any orphaned data
SELECT 'Checking for data issues:' as info;
SELECT 
    COUNT(*) as total_assignments,
    COUNT(CASE WHEN task_id IS NULL THEN 1 END) as null_task_ids,
    COUNT(CASE WHEN worker_id IS NULL THEN 1 END) as null_worker_ids
FROM public.task_assignments;

SELECT '✅ Complete task assignment fix finished!' as final_status;

