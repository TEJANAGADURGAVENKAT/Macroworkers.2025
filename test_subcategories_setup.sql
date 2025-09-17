-- Test subcategories system setup
-- Run this to verify the database is properly configured

-- 1. Check if tables exist
SELECT 
  'TABLES CHECK' as section,
  table_name,
  CASE WHEN table_name IN ('categories', 'subcategories') THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('categories', 'subcategories')
ORDER BY table_name;

-- 2. Check categories data
SELECT 
  'CATEGORIES' as section,
  name,
  description,
  icon,
  color
FROM public.categories
ORDER BY name;

-- 3. Check subcategories by category
SELECT 
  'IT SUBCATEGORIES' as section,
  s.name as subcategory,
  jsonb_array_length(s.skills) as skill_count,
  s.skills
FROM public.categories c
JOIN public.subcategories s ON s.category_id = c.id
WHERE c.name = 'IT'
ORDER BY s.name;

SELECT 
  'DIGITAL MARKETING SUBCATEGORIES' as section,
  s.name as subcategory,
  jsonb_array_length(s.skills) as skill_count,
  s.skills
FROM public.categories c
JOIN public.subcategories s ON s.category_id = c.id
WHERE c.name = 'Digital Marketing'
ORDER BY s.name;

SELECT 
  'BLOCKCHAIN SUBCATEGORIES' as section,
  s.name as subcategory,
  jsonb_array_length(s.skills) as skill_count,
  s.skills
FROM public.categories c
JOIN public.subcategories s ON s.category_id = c.id
WHERE c.name = 'Blockchain/AI'
ORDER BY s.name;

-- 4. Test the query that the frontend will use
SELECT 
  'FRONTEND QUERY TEST' as section,
  s.id,
  s.name,
  s.description,
  s.skills,
  s.category_id
FROM public.subcategories s
JOIN public.categories c ON s.category_id = c.id
WHERE c.name = 'IT'
ORDER BY s.name ASC;

-- 5. Count totals
SELECT 
  'SUMMARY' as section,
  (SELECT COUNT(*) FROM public.categories) as total_categories,
  (SELECT COUNT(*) FROM public.subcategories) as total_subcategories,
  (SELECT SUM(jsonb_array_length(skills)) FROM public.subcategories) as total_skills;
