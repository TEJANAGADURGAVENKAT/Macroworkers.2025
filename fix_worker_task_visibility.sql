-- Complete fix for worker task visibility by category
-- This script ensures proper category matching and data consistency

BEGIN;

-- 1. Ensure all required columns exist
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS role_category TEXT,
ADD COLUMN IF NOT EXISTS required_rating DECIMAL(2,1) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS max_workers INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS assigned_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS assignment_start_time TIME,
ADD COLUMN IF NOT EXISTS assignment_end_time TIME;

-- 2. Ensure profiles table has category column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS total_tasks_completed INTEGER DEFAULT 0;

-- 3. Set up proper constraints for categories
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_category_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_category_check 
CHECK (category IS NULL OR category IN ('IT', 'Digital Marketing', 'Blockchain/AI', 'General'));

-- 4. Fix existing task categories
UPDATE public.tasks 
SET role_category = 'IT'
WHERE role_category IN ('IT Department', 'it', 'It', 'IT DEPARTMENT');

UPDATE public.tasks 
SET role_category = 'Digital Marketing'
WHERE role_category IN ('digital marketing', 'Digital marketing', 'DIGITAL MARKETING');

UPDATE public.tasks 
SET role_category = 'Blockchain/AI'
WHERE role_category IN ('Blockchain', 'blockchain', 'AI', 'ai', 'Blockchain/ai', 'BLOCKCHAIN');

-- 5. Set default role_category for existing tasks without one
UPDATE public.tasks 
SET role_category = 'General'
WHERE role_category IS NULL OR role_category NOT IN ('IT', 'Digital Marketing', 'Blockchain/AI', 'General');

-- 6. Fix worker profiles - ensure all workers have a category
UPDATE public.profiles 
SET category = 'IT'
WHERE role = 'worker' AND (category IS NULL OR category = '');

-- 7. Create test tasks for each category if they don't exist
INSERT INTO public.tasks (
  title, description, category, role_category, difficulty, budget, status, 
  created_by, required_rating, max_workers, assigned_count
) 
SELECT 
  'IT Developer Task - ' || generate_random_uuid()::text,
  'Need a skilled IT developer for React project development',
  'Data Entry',
  'IT',
  'medium',
  1000,
  'active',
  (SELECT user_id FROM public.profiles WHERE role = 'employer' LIMIT 1),
  1.0,
  3,
  0
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks WHERE role_category = 'IT' AND status = 'active'
);

INSERT INTO public.tasks (
  title, description, category, role_category, difficulty, budget, status, 
  created_by, required_rating, max_workers, assigned_count
) 
SELECT 
  'Digital Marketing Campaign - ' || generate_random_uuid()::text,
  'Create comprehensive social media marketing strategy',
  'Social Media',
  'Digital Marketing',
  'easy',
  500,
  'active',
  (SELECT user_id FROM public.profiles WHERE role = 'employer' LIMIT 1),
  1.0,
  2,
  0
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks WHERE role_category = 'Digital Marketing' AND status = 'active'
);

INSERT INTO public.tasks (
  title, description, category, role_category, difficulty, budget, status, 
  created_by, required_rating, max_workers, assigned_count
) 
SELECT 
  'Blockchain Smart Contract - ' || generate_random_uuid()::text,
  'Audit and optimize smart contract for DeFi platform',
  'Content Creation',
  'Blockchain/AI',
  'hard',
  2000,
  'active',
  (SELECT user_id FROM public.profiles WHERE role = 'employer' LIMIT 1),
  3.0,
  1,
  0
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks WHERE role_category = 'Blockchain/AI' AND status = 'active'
);

-- 8. Create test worker profiles for different categories if needed
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Create IT worker if doesn't exist
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'worker' AND category = 'IT') THEN
        -- You'll need to insert a proper auth.users record first, or use existing user
        UPDATE public.profiles 
        SET category = 'IT', rating = 2.0, total_tasks_completed = 5
        WHERE role = 'worker' AND category IS NULL 
        LIMIT 1;
    END IF;
    
    -- Create Digital Marketing worker if doesn't exist
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'worker' AND category = 'Digital Marketing') THEN
        UPDATE public.profiles 
        SET category = 'Digital Marketing', rating = 1.5, total_tasks_completed = 3
        WHERE role = 'worker' AND category IS NULL 
        LIMIT 1;
    END IF;
END $$;

-- 9. Verification queries
SELECT 'TASK CATEGORIES AFTER FIX' as section, role_category, COUNT(*) as task_count
FROM public.tasks 
WHERE status = 'active'
GROUP BY role_category
ORDER BY task_count DESC;

SELECT 'WORKER CATEGORIES AFTER FIX' as section, category, COUNT(*) as worker_count
FROM public.profiles 
WHERE role = 'worker'
GROUP BY category
ORDER BY worker_count DESC;

-- 10. Show matching logic test
SELECT 
  'MATCHING TEST' as section,
  t.title as task_title,
  t.role_category as task_category,
  t.required_rating,
  p.full_name as worker_name,
  p.category as worker_category,
  p.rating as worker_rating,
  CASE 
    WHEN p.category = t.role_category OR t.role_category = 'General' THEN 'MATCH'
    ELSE 'NO MATCH'
  END as category_match,
  CASE 
    WHEN p.rating >= t.required_rating THEN 'QUALIFIED'
    ELSE 'NOT QUALIFIED'
  END as rating_match
FROM public.tasks t
CROSS JOIN public.profiles p
WHERE t.status = 'active' 
  AND p.role = 'worker'
  AND t.role_category IS NOT NULL
  AND p.category IS NOT NULL
ORDER BY t.role_category, p.category
LIMIT 20;

COMMIT;
