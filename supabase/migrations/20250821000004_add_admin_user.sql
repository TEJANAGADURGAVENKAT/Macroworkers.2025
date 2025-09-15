-- Add admin user for testing (optional)
-- Replace 'your-email@example.com' with the actual email of the user you want to make admin

-- First, find the user_id from auth.users table
-- SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Then update the profiles table to make them admin
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE user_id = 'user-id-from-above-query';

-- Example (uncomment and modify as needed):
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE email = 'your-email@example.com';
