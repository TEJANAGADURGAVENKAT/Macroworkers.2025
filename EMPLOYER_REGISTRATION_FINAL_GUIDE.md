# Final Fix for Employer Registration Issues

## Problems Identified
1. **Email addresses not showing** in the database after employer registration
2. **Invalid login credentials** error when trying to sign in
3. **Profile creation failing** due to RLS policy issues
4. **Document upload failing** due to storage bucket issues

## Complete Solution

### Step 1: Run the Final Fix SQL

Run this SQL script in your Supabase SQL Editor:

```sql
-- Final fix for employer registration issues based on your schema
BEGIN;

-- 1. Drop existing RLS policies on profiles table
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;

-- 2. Create new RLS policies for profiles table
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Allow service role to manage all profiles (for admin operations)
CREATE POLICY "Service role can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (auth.role() = 'service_role');

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create profiles for existing users who don't have them
INSERT INTO public.profiles (user_id, full_name, email, role, phone, category, worker_status, status, created_at, updated_at)
SELECT 
    u.id as user_id,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Unknown User') as full_name,
    u.email,
    u.role,
    COALESCE(u.raw_user_meta_data->>'phone', '') as phone,
    COALESCE(u.raw_user_meta_data->>'category', '') as category,
    CASE 
        WHEN u.role = 'employer' THEN 'verification_pending'
        ELSE 'document_upload_pending'
    END as worker_status,
    CASE 
        WHEN u.role = 'employer' THEN 'verification_pending'
        ELSE 'document_upload_pending'
    END as status,
    u.created_at,
    now() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
AND u.role IN ('employer', 'worker')
ON CONFLICT (user_id) DO NOTHING;

-- 4. Update existing profiles with missing email addresses
UPDATE public.profiles 
SET 
    email = u.email,
    updated_at = now()
FROM auth.users u
WHERE profiles.user_id = u.id
AND (profiles.email IS NULL OR profiles.email = '');

-- 5. Update employer profiles to have correct status
UPDATE public.profiles 
SET 
    worker_status = 'verification_pending',
    status = 'verification_pending',
    updated_at = now()
WHERE role = 'employer'
AND (worker_status IS NULL OR status IS NULL);

-- 6. Confirm emails for existing users
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- 7. Create employer-documents storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employer-documents',
  'employer-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 8. Drop existing storage policies (to avoid conflicts)
DROP POLICY IF EXISTS "Allow employers to upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow employers to view their documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow employers to delete their documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to access all employer documents" ON storage.objects;

-- 9. Create new RLS policies for storage.objects
CREATE POLICY "Allow employers to upload documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'employer-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow employers to view their documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'employer-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow employers to delete their documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'employer-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow admins to access all employer documents" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'employer-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

COMMIT;
```

### Step 2: Verify the Fix

Run this verification script to check if everything is working:

```sql
-- Verification script to check if employer registration is working
-- 1. Check if all users have profiles
SELECT 
    'Users without profiles' as check_type,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
AND u.role IN ('employer', 'worker')

UNION ALL

-- 2. Check if all profiles have email addresses
SELECT 
    'Profiles without email' as check_type,
    COUNT(*) as count
FROM public.profiles p
WHERE p.email IS NULL OR p.email = ''

UNION ALL

-- 3. Check if all users have confirmed emails
SELECT 
    'Users with unconfirmed emails' as check_type,
    COUNT(*) as count
FROM auth.users u
WHERE u.email_confirmed_at IS NULL

UNION ALL

-- 4. Check employer profiles specifically
SELECT 
    'Employer profiles with correct status' as check_type,
    COUNT(*) as count
FROM public.profiles p
WHERE p.role = 'employer'
AND p.worker_status = 'verification_pending'
AND p.status = 'verification_pending';
```

### Step 3: Test the Registration Process

1. **Open Browser Console** (F12 → Console tab)
2. **Register a new employer** with a new email address
3. **Check console logs** for:
   - "Creating profile with data:" - Shows profile creation attempt
   - "Profile created successfully" - Shows successful profile creation
   - Any error messages if creation fails

### Step 4: Test the Sign-In Process

1. **Try to sign in** with the registered employer account
2. **Check console logs** for:
   - "Attempting to sign in with email:" - Shows sign-in attempt
   - "Sign in successful:" - Shows successful authentication
   - Any error messages if sign-in fails

### Step 5: Test Document Upload

1. **Go to** `/employer/verify` page
2. **Try uploading a PDF document**
3. **Check console logs** for:
   - "File details:" - Shows file information
   - "File validation passed:" - Shows validation success
   - "Document type mapping:" - Shows the mapping
   - "File Uploaded" success message

## Expected Results

After running these fixes:

1. **Registration**: Should create profiles with email addresses and correct status
2. **Sign-In**: Should work without "invalid credentials" errors
3. **Document Upload**: Should work without RLS policy errors
4. **Admin Panel**: Should show employers with their email addresses
5. **Database**: Should have proper profiles for all users with correct status

## Troubleshooting

If issues persist:

1. **Check Console Logs**: Look for specific error messages
2. **Run Verification Script**: Check if all counts are 0
3. **Check RLS Policies**: Ensure policies were created successfully
4. **Check Email Confirmation**: Ensure users have confirmed emails
5. **Check Storage Bucket**: Verify the employer-documents bucket exists

## Files Modified

- `src/hooks/useAuth.tsx` - Enhanced profile creation with email handling
- `fix_employer_registration_final.sql` - Complete fix for all issues
- `verify_employer_registration.sql` - Verification script
- `EMPLOYER_REGISTRATION_FINAL_GUIDE.md` - This comprehensive guide



