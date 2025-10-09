-- Final fix for task assignment - ensures database is properly configured
-- Run this to fix any remaining database issues

-- Step 1: Ensure task_assignments table has correct structure
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
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
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignments' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments ADD COLUMN created_at timestamp with time zone NOT NULL DEFAULT now();
        RAISE NOTICE 'Added created_at column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignments' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments ADD COLUMN updated_at timestamp with time zone NOT NULL DEFAULT now();
        RAISE NOTICE 'Added updated_at column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignments' 
        AND column_name = 'assigned_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments ADD COLUMN assigned_at timestamp with time zone NOT NULL DEFAULT now();
        RAISE NOTICE 'Added assigned_at column';
    END IF;
END $$;

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

-- Step 3: Set up RLS with permissive policies
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.task_assignments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.task_assignments;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.task_assignments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.task_assignments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.task_assignments;

-- Create comprehensive policies
CREATE POLICY "Enable all operations for authenticated users" ON public.task_assignments
FOR ALL USING (auth.role() = 'authenticated');

-- Step 4: Grant all necessary permissions
GRANT ALL ON public.task_assignments TO authenticated;
GRANT ALL ON public.task_assignments TO anon;
GRANT ALL ON public.task_assignments TO service_role;

-- Step 5: Test the configuration
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
        
        RAISE NOTICE '✅ Database configuration test successful!';
    ELSE
        RAISE NOTICE '⚠️ No sample data available for testing';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Database configuration test failed: %', SQLERRM;
END $$;

SELECT '✅ Task assignment database configuration completed!' as final_status;

