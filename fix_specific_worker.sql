-- Fix specific worker profile (793f843c-491a-4211-8ab1-8c05fed61aa3)
-- Run this in your Supabase SQL editor

-- First, check what data exists for this worker in auth.users
SELECT 
  id,
  email,
  raw_user_meta_data
FROM auth.users 
WHERE id = '793f843c-491a-4211-8ab1-8c05fed61aa3';

-- Then, check current profile data
SELECT * FROM public.profiles 
WHERE user_id = '793f843c-491a-4211-8ab1-8c05fed61aa3';

-- Update the profile with real data
UPDATE public.profiles 
SET 
  full_name = COALESCE(
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = '793f843c-491a-4211-8ab1-8c05fed61aa3'),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = '793f843c-491a-4211-8ab1-8c05fed61aa3'),
    (SELECT email FROM auth.users WHERE id = '793f843c-491a-4211-8ab1-8c05fed61aa3'),
    'Worker 793f843c'
  ),
  email = (SELECT email FROM auth.users WHERE id = '793f843c-491a-4211-8ab1-8c05fed61aa3'),
  phone = (SELECT raw_user_meta_data->>'phone' FROM auth.users WHERE id = '793f843c-491a-4211-8ab1-8c05fed61aa3'),
  updated_at = NOW()
WHERE user_id = '793f843c-491a-4211-8ab1-8c05fed61aa3';

-- Verify the update
SELECT * FROM public.profiles 
WHERE user_id = '793f843c-491a-4211-8ab1-8c05fed61aa3';


