-- IMMEDIATE FIX - Run this right now to fix the skills error
-- This will work even if subcategories tables don't exist

BEGIN;

-- Just run this simple query to test database connection
SELECT 'Database connection working' as status, now() as timestamp;

-- If the above works, then run the full subcategories setup:

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- Create subcategories table  
CREATE TABLE IF NOT EXISTS public.subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  name TEXT NOT NULL,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE(category_id, name)
);

-- Enable public read access
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read subcategories" ON public.subcategories FOR SELECT USING (true);

-- Insert data
INSERT INTO public.categories (name, description) VALUES
  ('IT', 'Information Technology'),
  ('Digital Marketing', 'Digital Marketing'),
  ('Blockchain/AI', 'Blockchain and AI')
ON CONFLICT (name) DO NOTHING;

-- Insert minimal IT subcategories for immediate fix
INSERT INTO public.subcategories (category_id, name, skills)
SELECT c.id, 'Frontend Development', '["HTML", "CSS", "JavaScript", "React.js", "UI/UX Basics"]'::jsonb
FROM public.categories c WHERE c.name = 'IT'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.subcategories (category_id, name, skills)
SELECT c.id, 'Backend Development', '["Node.js", "Express.js", "Python", "Databases", "API Development"]'::jsonb
FROM public.categories c WHERE c.name = 'IT'
ON CONFLICT (category_id, name) DO NOTHING;

-- Test the query
SELECT 
  'TEST RESULT' as status,
  s.name as subcategory,
  s.skills
FROM public.categories c
JOIN public.subcategories s ON s.category_id = c.id
WHERE c.name = 'IT'
ORDER BY s.name;

COMMIT;
