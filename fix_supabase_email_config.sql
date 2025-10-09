-- Fix Supabase email configuration for new registrations
-- Run this in your Supabase SQL editor

BEGIN;

-- 1. Check Supabase auth configuration
SELECT 
    key,
    value
FROM auth.config 
WHERE key IN ('ENABLE_SIGNUP', 'ENABLE_EMAIL_CONFIRMATIONS', 'ENABLE_PHONE_CONFIRMATIONS');

-- 2. Create a trigger function to handle email updates
CREATE OR REPLACE FUNCTION public.handle_auth_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- If email is NULL but exists in metadata, update it
  IF NEW.email IS NULL AND NEW.raw_user_meta_data->>'email' IS NOT NULL THEN
    NEW.email = NEW.raw_user_meta_data->>'email';
  END IF;
  
  -- Create profile if it doesn't exist
  INSERT INTO public.profiles (user_id, full_name, email, role, phone, category, worker_status, status, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'worker'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'category', ''),
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'worker') = 'employer' THEN 'verification_pending'
      ELSE 'document_upload_pending'
    END,
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'worker') = 'employer' THEN 'verification_pending'
      ELSE 'document_upload_pending'
    END,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    category = EXCLUDED.category,
    worker_status = EXCLUDED.worker_status,
    status = EXCLUDED.status,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_email();

-- 5. Also create a trigger for updates
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_email();

-- 6. Fix existing users with NULL emails
UPDATE auth.users 
SET 
    email = raw_user_meta_data->>'email',
    updated_at = now()
WHERE email IS NULL
AND raw_user_meta_data->>'email' IS NOT NULL
AND raw_user_meta_data->>'email' != '';

-- 7. Create profiles for existing users who don't have them
INSERT INTO public.profiles (user_id, full_name, email, role, phone, category, worker_status, status, created_at, updated_at)
SELECT 
    u.id as user_id,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Unknown User') as full_name,
    u.email,
    COALESCE(u.raw_user_meta_data->>'role', 'worker') as role,
    COALESCE(u.raw_user_meta_data->>'phone', '') as phone,
    COALESCE(u.raw_user_meta_data->>'category', '') as category,
    CASE 
      WHEN COALESCE(u.raw_user_meta_data->>'role', 'worker') = 'employer' THEN 'verification_pending'
      ELSE 'document_upload_pending'
    END as worker_status,
    CASE 
      WHEN COALESCE(u.raw_user_meta_data->>'role', 'worker') = 'employer' THEN 'verification_pending'
      ELSE 'document_upload_pending'
    END as status,
    u.created_at,
    now() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 8. Update existing profiles with email from auth.users
UPDATE public.profiles 
SET 
    email = u.email,
    updated_at = now()
FROM auth.users u
WHERE profiles.user_id = u.id
AND (profiles.email IS NULL OR profiles.email = '' OR profiles.email != u.email);

-- 9. Confirm all user emails
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

COMMIT;



