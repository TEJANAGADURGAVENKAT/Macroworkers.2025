-- Simple fix for task assignment 400 error
-- This addresses the specific insert issue

-- Step 1: Ensure the table has all required columns
DO $$ 
BEGIN
    -- Add id column if missing
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

-- Step 2: Set up RLS and policies
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.task_assignments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.task_assignments;

-- Add simple policies
CREATE POLICY "Enable insert for authenticated users" ON public.task_assignments
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable select for authenticated users" ON public.task_assignments
FOR SELECT USING (auth.role() = 'authenticated');

-- Step 3: Grant permissions
GRANT ALL ON public.task_assignments TO authenticated;
GRANT ALL ON public.task_assignments TO anon;

-- Step 4: Test the fix
SELECT 'Testing task assignment fix...' as status;

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '✅ Task assignment fix completed! Try assigning a task now.' as final_status;

