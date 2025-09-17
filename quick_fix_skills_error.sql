-- Quick fix for "Error loading skills" issue
-- Run this in Supabase SQL Editor to immediately fix the error

BEGIN;

-- 1. Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create subcategories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id, name)
);

-- 3. Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- 4. Create public read policies
CREATE POLICY "Categories are publicly readable" 
ON public.categories FOR SELECT 
USING (true);

CREATE POLICY "Subcategories are publicly readable" 
ON public.subcategories FOR SELECT 
USING (true);

-- 5. Insert main categories
INSERT INTO public.categories (name, description, icon, color) VALUES
  ('IT', 'Information Technology and Software Development', 'Code', 'bg-blue-500'),
  ('Digital Marketing', 'Digital Marketing and Content Creation', 'TrendingUp', 'bg-green-500'),
  ('Blockchain/AI', 'Blockchain and Artificial Intelligence', 'Link', 'bg-purple-500')
ON CONFLICT (name) DO NOTHING;

-- 6. Insert IT subcategories
INSERT INTO public.subcategories (category_id, name, description, skills)
SELECT 
  c.id,
  subcategory_name,
  subcategory_description,
  skills_json::jsonb
FROM public.categories c,
(VALUES 
  ('Frontend Development', 'User interface and client-side development', '["HTML", "CSS", "JavaScript", "React.js", "UI/UX Basics"]'),
  ('Backend Development', 'Server-side logic and API development', '["Node.js", "Express.js", "Python", "Databases", "API Development"]'),
  ('Full Stack Development', 'End-to-end web development', '["React.js", "Node.js", "MongoDB", "REST APIs", "Version Control"]'),
  ('Mobile Development', 'Mobile application development', '["Flutter", "React Native", "iOS", "Android", "App Store Deployment"]'),
  ('Database Administration', 'Database management and optimization', '["SQL", "Database Optimization", "Backups", "Security", "Performance Tuning"]'),
  ('Cloud & DevOps', 'Cloud infrastructure and deployment', '["AWS", "Azure", "CI/CD", "Docker", "Kubernetes"]')
) AS subcats(subcategory_name, subcategory_description, skills_json)
WHERE c.name = 'IT'
ON CONFLICT (category_id, name) DO NOTHING;

-- 7. Insert Digital Marketing subcategories
INSERT INTO public.subcategories (category_id, name, description, skills)
SELECT 
  c.id,
  subcategory_name,
  subcategory_description,
  skills_json::jsonb
FROM public.categories c,
(VALUES 
  ('SEO Specialist', 'Search engine optimization expertise', '["Keyword Research", "On-page SEO", "Off-page SEO", "Technical SEO", "Content Optimization"]'),
  ('Content Marketing', 'Content creation and marketing strategy', '["Content Writing", "Copywriting", "Blog Management", "Storytelling", "Editing"]'),
  ('Social Media Management', 'Social media strategy and management', '["Social Media Strategy", "Content Scheduling", "Analytics & Insights", "Community Engagement", "Paid Campaigns"]'),
  ('PPC Advertising', 'Pay-per-click advertising and optimization', '["Google Ads", "Facebook Ads", "Campaign Optimization", "A/B Testing", "Conversion Tracking"]'),
  ('Email Marketing', 'Email campaign management and automation', '["Email Campaigns", "Automation Tools", "A/B Testing", "Copywriting", "List Segmentation"]')
) AS subcats(subcategory_name, subcategory_description, skills_json)
WHERE c.name = 'Digital Marketing'
ON CONFLICT (category_id, name) DO NOTHING;

-- 8. Insert Blockchain subcategories
INSERT INTO public.subcategories (category_id, name, description, skills)
SELECT 
  c.id,
  subcategory_name,
  subcategory_description,
  skills_json::jsonb
FROM public.categories c,
(VALUES 
  ('Blockchain Development', 'Core blockchain development skills', '["Solidity", "Web3.js", "Ethereum", "Smart Contracts", "DeFi Protocols"]'),
  ('Smart Contract Auditing', 'Smart contract security and auditing', '["Solidity", "Security Testing", "Gas Optimization", "MythX", "Slither"]'),
  ('Web3 Development', 'Web3 frontend and integration development', '["React.js", "Next.js", "Ethers.js", "IPFS", "Smart Contracts"]'),
  ('Crypto Analysis', 'Cryptocurrency market analysis', '["Technical Analysis", "Fundamental Analysis", "On-chain Data", "Market Trends", "Risk Management"]'),
  ('Blockchain Architecture', 'Blockchain system design and architecture', '["Consensus Mechanisms", "System Design", "Node Management", "Scalability", "Security"]'),
  ('NFT/Token Development', 'NFT and token contract development', '["ERC-20", "ERC-721", "ERC-1155", "Tokenomics", "Minting Contracts"]')
) AS subcats(subcategory_name, subcategory_description, skills_json)
WHERE c.name = 'Blockchain/AI'
ON CONFLICT (category_id, name) DO NOTHING;

-- 9. Verify the setup
SELECT 
  'SUCCESS - SETUP COMPLETE' as status,
  c.name as category,
  COUNT(s.id) as subcategory_count
FROM public.categories c
LEFT JOIN public.subcategories s ON s.category_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;

COMMIT;
