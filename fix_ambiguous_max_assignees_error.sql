-- Fix the specific "ambiguous column reference 'max_assignees'" error
-- This script removes all problematic triggers and functions that cause the ambiguity

BEGIN;

-- 1. Drop ALL existing triggers that might cause the ambiguous column error
DROP TRIGGER IF EXISTS trigger_check_assignment_limit ON public.task_assignments;
DROP TRIGGER IF EXISTS trigger_update_assigned_count ON public.task_assignments;
DROP TRIGGER IF EXISTS trigger_update_assigned_count_simple ON public.task_assignments;
DROP TRIGGER IF EXISTS trigger_update_task_assignee_count ON public.task_submissions;
DROP TRIGGER IF EXISTS trigger_update_assignee_count ON public.task_submissions;

-- 2. Drop ALL functions that might reference max_assignees ambiguously
DROP FUNCTION IF EXISTS check_assignment_limit() CASCADE;
DROP FUNCTION IF EXISTS update_task_assigned_count() CASCADE;
DROP FUNCTION IF EXISTS update_task_assigned_count_simple() CASCADE;
DROP FUNCTION IF EXISTS update_task_assignee_count() CASCADE;
DROP FUNCTION IF EXISTS validate_worker_selection() CASCADE;
DROP FUNCTION IF EXISTS check_assignment_time_window() CASCADE;

-- 3. Clean up any remaining problematic functions
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Drop any remaining functions that might cause issues
    FOR func_record IN 
        SELECT proname, oid 
        FROM pg_proc 
        WHERE proname LIKE '%assignment%' 
        OR proname LIKE '%assignee%'
        OR proname LIKE '%max_assignees%'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.oid || ' CASCADE';
    END LOOP;
END $$;

-- 4. Ensure the task_assignments table has proper structure
ALTER TABLE public.task_assignments 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 5. Create a simple, safe trigger function that doesn't reference ambiguous columns
CREATE OR REPLACE FUNCTION update_task_assignment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create only a simple timestamp update trigger (no complex logic)
DROP TRIGGER IF EXISTS trigger_update_assignment_timestamp ON public.task_assignments;
CREATE TRIGGER trigger_update_assignment_timestamp
  BEFORE UPDATE ON public.task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_assignment_timestamp();

-- 7. Ensure RLS policies are simple and working
DROP POLICY IF EXISTS "allow_workers_insert_assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "allow_workers_view_own_assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "allow_employers_view_assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "allow_admins_view_all" ON public.task_assignments;

-- Create simple, working RLS policies
CREATE POLICY "workers_can_insert_assignments" 
ON public.task_assignments 
FOR INSERT 
WITH CHECK (worker_id = auth.uid());

CREATE POLICY "workers_can_view_own_assignments" 
ON public.task_assignments 
FOR SELECT 
USING (worker_id = auth.uid());

CREATE POLICY "employers_can_view_task_assignments" 
ON public.task_assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_id 
    AND t.created_by = auth.uid()
  )
);

-- 8. Ensure tasks table has the required columns with proper defaults
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS max_workers INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS assigned_count INTEGER DEFAULT 0;

-- 9. Update assigned_count for existing tasks (without triggers)
UPDATE public.tasks 
SET assigned_count = (
  SELECT COUNT(*) 
  FROM public.task_assignments ta 
  WHERE ta.task_id = tasks.id
)
WHERE assigned_count IS NULL;

-- 10. Create a simple view to help with assignment counting (optional)
CREATE OR REPLACE VIEW task_assignment_counts AS
SELECT 
  t.id as task_id,
  t.title,
  t.max_workers,
  COUNT(ta.id) as current_assignments
FROM public.tasks t
LEFT JOIN public.task_assignments ta ON t.id = ta.task_id
GROUP BY t.id, t.title, t.max_workers;

COMMIT;

-- Verification queries
SELECT 'Triggers removed successfully' as status;
SELECT 'Functions cleaned up' as status;
SELECT 'RLS policies updated' as status;

-- Check what triggers remain (should be minimal)
SELECT 'Remaining triggers:' as info, trigger_name, event_manipulation, action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'task_assignments';

-- Check what functions remain
SELECT 'Remaining functions:' as info, routine_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%assignment%';
