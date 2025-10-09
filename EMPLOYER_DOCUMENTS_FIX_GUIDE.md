# Fix Employer Documents Upload Issue

## Problem
The error "new row violates row-level security policy" occurs because the Supabase Storage bucket `employer-documents` doesn't have the proper RLS (Row Level Security) policies configured.

## Solution

### Step 1: Create the Storage Bucket and RLS Policies

Run this SQL script in your Supabase SQL Editor:

```sql
-- Create employer-documents storage bucket with proper RLS policies
-- Run this in your Supabase SQL editor

-- 1. Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employer-documents',
  'employer-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create RLS policies for storage.objects
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

-- 3. Allow admins to access all employer documents
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
```

### Step 2: Verify the Setup

Run this test script to verify everything is working:

```sql
-- Test script to verify employer-documents bucket setup
-- Run this in your Supabase SQL editor to check if everything is working

-- 1. Check if the bucket exists
SELECT * FROM storage.buckets WHERE id = 'employer-documents';

-- 2. Check RLS policies on storage.objects
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- 3. Check if RLS is enabled on storage.objects
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 4. Test query to see if we can access the bucket (this should work for authenticated users)
SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'employer-documents';

-- 5. Check profiles table structure for employers
SELECT user_id, full_name, email, role, worker_status, status 
FROM public.profiles 
WHERE role = 'employer' 
LIMIT 5;
```

### Step 3: Test the Upload

1. Go to `/employer/verify` page
2. Try uploading a document
3. Check the browser console for any errors
4. Verify the file appears in Supabase Storage under `employer-documents` bucket

## What the Fix Does

1. **Creates the Storage Bucket**: Sets up the `employer-documents` bucket with proper file size limits and allowed MIME types
2. **Sets up RLS Policies**: Allows employers to upload, view, and delete their own documents
3. **Admin Access**: Allows admins to view and download all employer documents for verification
4. **Security**: Ensures users can only access their own files based on the folder structure (`user_id/filename`)

## File Structure in Storage

Files will be stored with this structure:
```
employer-documents/
├── {user_id_1}/
│   ├── cin_1234567890.pdf
│   ├── moa_1234567891.pdf
│   └── ...
├── {user_id_2}/
│   ├── cin_1234567892.pdf
│   └── ...
```

## Troubleshooting

If you still get errors:

1. **Check Authentication**: Make sure the user is properly authenticated
2. **Check User Role**: Verify the user has `role = 'employer'` in the profiles table
3. **Check Bucket**: Ensure the bucket was created successfully
4. **Check Policies**: Verify the RLS policies were created without errors
5. **Check File Size**: Ensure files are under 10MB
6. **Check File Type**: Ensure files are PDF, JPEG, or PNG

## Additional Features Added

The updated code also includes:
- **Loading States**: Shows upload progress with spinner
- **Better Error Messages**: More specific error messages for different failure types
- **File Validation**: Client-side validation before upload
- **Disabled States**: Prevents multiple uploads while one is in progress



