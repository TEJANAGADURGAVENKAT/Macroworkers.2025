-- Fix task assignment database configuration issues
-- This script addresses common issues that cause "Database configuration error"

-- 1. Ensure task_assignments table has proper structure
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
        RAISE NOTICE 'Added id column to task_assignments';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignments' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments ADD COLUMN created_at timestamp with time zone NOT NULL DEFAULT now();
        RAISE NOTICE 'Added created_at column to task_assignments';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignments' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments ADD COLUMN updated_at timestamp with time zone NOT NULL DEFAULT now();
        RAISE NOTICE 'Added updated_at column to task_assignments';
    END IF;
END $$;

-- 2. Add primary key if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'task_assignments' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.task_assignments ADD CONSTRAINT task_assignments_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added primary key to task_assignments';
    END IF;
END $$;

-- 3. Add foreign key constraints if missing
DO $$ 
BEGIN
    -- Add foreign key to tasks table
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
    
    -- Add foreign key to profiles table (using user_id)
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

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON public.task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_worker_id ON public.task_assignments(worker_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_status ON public.task_assignments(status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_at ON public.task_assignments(assigned_at);

-- 5. Add RLS policies if missing
DO $$ 
BEGIN
    -- Enable RLS on task_assignments if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'task_assignments' 
        AND rowsecurity = true
        AND schemaname = 'public'
    ) THEN
        ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on task_assignments';
    END IF;
    
    -- Add policy for workers to see their own assignments
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'task_assignments' 
        AND policyname = 'Workers can view their own assignments'
        AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Workers can view their own assignments" ON public.task_assignments
        FOR SELECT USING (worker_id = auth.uid());
        RAISE NOTICE 'Added RLS policy for workers';
    END IF;
    
    -- Add policy for employers to see assignments for their tasks
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'task_assignments' 
        AND policyname = 'Employers can view assignments for their tasks'
        AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Employers can view assignments for their tasks" ON public.task_assignments
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.tasks t 
                WHERE t.id = task_assignments.task_id 
                AND t.user_id = auth.uid()
            )
        );
        RAISE NOTICE 'Added RLS policy for employers';
    END IF;
    
    -- Add policy for admins to see all assignments
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'task_assignments' 
        AND policyname = 'Admins can view all assignments'
        AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Admins can view all assignments" ON public.task_assignments
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles p 
                WHERE p.user_id = auth.uid() 
                AND p.role = 'admin'
            )
        );
        RAISE NOTICE 'Added RLS policy for admins';
    END IF;
END $$;

-- 6. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_assignments TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.task_assignments_id_seq TO authenticated;

-- 7. Add trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_task_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_task_assignments_updated_at ON public.task_assignments;
CREATE TRIGGER trigger_update_task_assignments_updated_at
    BEFORE UPDATE ON public.task_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_task_assignments_updated_at();

-- 8. Verify the fix
SELECT 'Verifying task_assignments table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Verifying constraints:' as info;
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'task_assignments' 
AND table_schema = 'public';

SELECT 'Verifying indexes:' as info;
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'task_assignments' 
AND schemaname = 'public';

SELECT '✅ Task assignment database configuration fixed!' as final_status;

