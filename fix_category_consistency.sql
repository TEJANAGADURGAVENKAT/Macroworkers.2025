-- Fix category consistency between tasks and worker profiles
-- Run this to normalize category values

BEGIN;

-- 0. Ensure role_category column exists in tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS role_category TEXT;

-- 1. Check current category values in tasks and profiles
SELECT 'CURRENT TASK CATEGORIES' as section, role_category, COUNT(*) as count
FROM public.tasks 
WHERE role_category IS NOT NULL
GROUP BY role_category
ORDER BY count DESC;

SELECT 'CURRENT WORKER CATEGORIES' as section, category, COUNT(*) as count
FROM public.profiles 
WHERE role = 'worker' AND category IS NOT NULL
GROUP BY category
ORDER BY count DESC;

-- 2. Fix inconsistent role_category values in tasks table
UPDATE public.tasks 
SET role_category = 'IT'
WHERE role_category IN ('IT Department', 'it', 'It');

UPDATE public.tasks 
SET role_category = 'Digital Marketing'
WHERE role_category IN ('digital marketing', 'Digital marketing');

UPDATE public.tasks 
SET role_category = 'Blockchain/AI'
WHERE role_category IN ('Blockchain', 'blockchain', 'AI', 'ai', 'Blockchain/ai');

-- 3. Set default for any NULL or unknown categories
UPDATE public.tasks 
SET role_category = 'General'
WHERE role_category IS NULL OR role_category NOT IN ('IT', 'Digital Marketing', 'Blockchain/AI', 'General');

-- 4. Verify the fixes
SELECT 'FIXED TASK CATEGORIES' as section, role_category, COUNT(*) as count
FROM public.tasks 
GROUP BY role_category
ORDER BY count DESC;

-- 5. Show sample tasks with their categories for verification
SELECT 
  'SAMPLE TASKS' as section,
  title,
  category,
  role_category,
  required_rating,
  created_at
FROM public.tasks 
ORDER BY created_at DESC
LIMIT 10;

-- 6. Show worker profiles with their categories
SELECT 
  'WORKER PROFILES' as section,
  full_name,
  category,
  rating,
  role
FROM public.profiles 
WHERE role = 'worker'
ORDER BY full_name
LIMIT 10;

COMMIT;
