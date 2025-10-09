# Complete Fix for Employer Registration Issues

## Problems
1. **Email addresses not showing** in the database after employer registration
2. **Invalid login credentials** error when trying to sign in
3. **Document upload failing** due to storage bucket issues

## Root Causes
1. **RLS Policies**: Row Level Security policies blocking profile creation
2. **Email Confirmation**: Users might not have confirmed their email addresses
3. **Profile Creation**: Profile creation failing silently during registration
4. **Storage Bucket**: Missing storage bucket and RLS policies for document uploads

## Complete Solution

### Step 1: Run the Complete Fix SQL

Run this SQL script in your Supabase SQL Editor:

```sql
-- Complete fix for employer registration and authentication issues
BEGIN;

-- 1. Fix RLS policies for profiles table
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create profiles for existing users who don't have them
INSERT INTO public.profiles (user_id, full_name, email, role, phone, category, created_at, updated_at)
SELECT 
    u.id as user_id,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Unknown User') as full_name,
    u.email,
    u.role,
    COALESCE(u.raw_user_meta_data->>'phone', '') as phone,
    COALESCE(u.raw_user_meta_data->>'category', '') as category,
    u.created_at,
    now() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
AND u.role IN ('employer', 'worker')
ON CONFLICT (user_id) DO NOTHING;

-- 3. Update existing profiles with missing email addresses
UPDATE public.profiles 
SET 
    email = u.email,
    updated_at = now()
FROM auth.users u
WHERE profiles.user_id = u.id
AND (profiles.email IS NULL OR profiles.email = '');

-- 4. Confirm emails for existing users
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- 5. Create employer-documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employer-documents',
  'employer-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 6. Create RLS policies for storage.objects
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

### Step 2: Test the Registration Process

1. **Open Browser Console** (F12 → Console tab)
2. **Register a new employer** with a new email address
3. **Check console logs** for:
   - "Creating profile with data:" - Shows profile creation attempt
   - "Profile created successfully" - Shows successful profile creation
   - Any error messages if creation fails

### Step 3: Test the Sign-In Process

1. **Try to sign in** with the registered employer account
2. **Check console logs** for:
   - "Attempting to sign in with email:" - Shows sign-in attempt
   - "Sign in successful:" - Shows successful authentication
   - Any error messages if sign-in fails

### Step 4: Test Document Upload

1. **Go to** `/employer/verify` page
2. **Try uploading a PDF document**
3. **Check console logs** for:
   - "File details:" - Shows file information
   - "File validation passed:" - Shows validation success
   - "Document type mapping:" - Shows the mapping
   - "File Uploaded" success message

### Step 5: Verify in Database

Run this SQL to check if everything is working:

```sql
-- Check if employers have profiles with email addresses
SELECT 
    u.id,
    u.email as auth_email,
    u.email_confirmed_at,
    p.full_name,
    p.email as profile_email,
    p.role,
    p.phone,
    p.category
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.role = 'employer'
ORDER BY u.created_at DESC;
```

## Expected Results

After running these fixes:

1. **Registration**: Should create profiles with email addresses
2. **Sign-In**: Should work without "invalid credentials" errors
3. **Document Upload**: Should work without RLS policy errors
4. **Admin Panel**: Should show employers with their email addresses
5. **Database**: Should have proper profiles for all users

## Troubleshooting

If issues persist:

1. **Check Console Logs**: Look for specific error messages
2. **Verify RLS Policies**: Ensure policies were created successfully
3. **Check Email Confirmation**: Ensure users have confirmed emails
4. **Check Storage Bucket**: Verify the employer-documents bucket exists
5. **Check Database**: Run the test SQL to verify profiles exist

## Files Modified

- `src/hooks/useAuth.tsx` - Enhanced profile creation with email handling
- `fix_employer_registration_complete.sql` - Complete fix for all issues
- `test_registration_flow.sql` - Tests the registration process
- `EMPLOYER_REGISTRATION_COMPLETE_FIX.md` - This comprehensive guide



