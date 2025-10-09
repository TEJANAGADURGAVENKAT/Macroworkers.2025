-- Fix for 400 Bad Request error when inserting into task_assignments
-- This addresses the specific error you're seeing

-- Step 1: Check current table structure
SELECT 'Current task_assignments structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Add missing columns that might be causing the 400 error
DO $$ 
BEGIN
    -- Add id column if missing (primary key)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignments' 
        AND column_name = 'id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();
        ALTER TABLE public.task_assignments ADD CONSTRAINT task_assignments_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added id column and primary key';
    END IF;
    
    -- Add created_at column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignments' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments ADD COLUMN created_at timestamp with time zone NOT NULL DEFAULT now();
        RAISE NOTICE 'Added created_at column';
    END IF;
    
    -- Add updated_at column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignments' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments ADD COLUMN updated_at timestamp with time zone NOT NULL DEFAULT now();
        RAISE NOTICE 'Added updated_at column';
    END IF;
END $$;

-- Step 3: Fix foreign key constraints
DO $$ 
BEGIN
    -- Add foreign key to tasks table if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'task_assignments' 
        AND constraint_name = 'task_assignments_task_id_fkey'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments 
        ADD CONSTRAINT task_assignments_task_id_fkey 
        FOREIGN KEY (task_id) REFERENCES public.tasks(id);
        RAISE NOTICE 'Added foreign key constraint for task_id';
    END IF;
    
    -- Add foreign key to profiles table if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'task_assignments' 
        AND constraint_name = 'task_assignments_worker_id_fkey'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments 
        ADD CONSTRAINT task_assignments_worker_id_fkey 
        FOREIGN KEY (worker_id) REFERENCES public.profiles(user_id);
        RAISE NOTICE 'Added foreign key constraint for worker_id';
    END IF;
END $$;

-- Step 4: Enable RLS and add policies
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.task_assignments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.task_assignments;

-- Add policy for authenticated users
CREATE POLICY "Enable insert for authenticated users" ON public.task_assignments
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable select for authenticated users" ON public.task_assignments
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.task_assignments
FOR UPDATE USING (auth.role() = 'authenticated');

-- Step 5: Grant permissions
GRANT ALL ON public.task_assignments TO authenticated;
GRANT ALL ON public.task_assignments TO anon;

-- Step 6: Test the table structure
SELECT 'Final table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 7: Check constraints
SELECT 'Table constraints:' as info;
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'task_assignments' 
AND table_schema = 'public';

-- Step 8: Test data availability
SELECT 'Testing data availability:' as info;
SELECT 
    (SELECT COUNT(*) FROM public.tasks WHERE status = 'pending') as available_tasks,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'worker' AND worker_status = 'active_employee') as available_workers;

-- Step 9: Test insert capability with a sample
DO $$ 
DECLARE
    sample_task_id uuid;
    sample_worker_id uuid;
BEGIN
    -- Get sample IDs
    SELECT id INTO sample_task_id FROM public.tasks WHERE status = 'pending' LIMIT 1;
    SELECT user_id INTO sample_worker_id FROM public.profiles WHERE role = 'worker' LIMIT 1;
    
    IF sample_task_id IS NOT NULL AND sample_worker_id IS NOT NULL THEN
        -- Try to insert a test record (will be rolled back)
        BEGIN
            INSERT INTO public.task_assignments (task_id, worker_id, status, assigned_at)
            VALUES (sample_task_id, sample_worker_id, 'assigned', now());
            
            -- If successful, delete the test record
            DELETE FROM public.task_assignments 
            WHERE task_id = sample_task_id AND worker_id = sample_worker_id AND status = 'assigned';
            
            RAISE NOTICE '✅ Insert test successful - table is ready for assignments';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Insert test failed: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '⚠️ No sample data available for testing';
    END IF;
END $$;

SELECT '✅ Task assignments table fix completed!' as final_status;

