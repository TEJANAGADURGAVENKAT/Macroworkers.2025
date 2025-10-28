-- Fix RLS policies for statistics to work on public homepage
-- This allows the homepage to display real statistics without requiring authentication

BEGIN;

-- 1. Allow public access to profiles table for counting workers
-- This is needed for the homepage statistics
DROP POLICY IF EXISTS "Public can view profile counts" ON public.profiles;
CREATE POLICY "Public can view profile counts" ON public.profiles
  FOR SELECT USING (true);

-- 2. Allow public access to task_submissions for counting completed tasks
-- This is needed for the homepage statistics
DROP POLICY IF EXISTS "Public can view submission counts" ON public.task_submissions;
CREATE POLICY "Public can view submission counts" ON public.task_submissions
  FOR SELECT USING (true);

-- 3. Allow public access to tasks table for budget information
-- This is needed for calculating total money earned
DROP POLICY IF EXISTS "Public can view task budgets" ON public.tasks;
CREATE POLICY "Public can view task budgets" ON public.tasks
  FOR SELECT USING (true);

-- 4. Create a function to get statistics safely
CREATE OR REPLACE FUNCTION get_platform_statistics()
RETURNS TABLE (
  total_workers BIGINT,
  completed_tasks BIGINT,
  total_money_earned DECIMAL,
  unique_countries BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'worker') as total_workers,
    (SELECT COUNT(*) FROM public.task_submissions WHERE status = 'approved') as completed_tasks,
    (SELECT COALESCE(SUM(t.budget), 0) 
     FROM public.task_submissions ts 
     JOIN public.tasks t ON ts.task_id = t.id 
     WHERE ts.status = 'approved') as total_money_earned,
    (SELECT COUNT(DISTINCT country) 
     FROM public.profiles 
     WHERE country IS NOT NULL) as unique_countries;
END;
$$;

-- 5. Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION get_platform_statistics() TO anon;
GRANT EXECUTE ON FUNCTION get_platform_statistics() TO authenticated;

COMMIT;

-- Test the function
SELECT * FROM get_platform_statistics();


