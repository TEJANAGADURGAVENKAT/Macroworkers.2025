# Manual Setup Guide - No SQL Permissions Required

## 🚨 Problem
You're getting permission errors when running SQL scripts. Let's set up everything manually through the Supabase Dashboard UI.

## ✅ Solution
Use the minimal SQL script + manual policy setup through the dashboard.

## 🚀 Step-by-Step Setup

### Step 1: Run Minimal SQL Script
1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `ajnqnvogdkjhymweaunr`
3. **Go to SQL Editor** in the left sidebar
4. **Copy and run this minimal script**:

```sql
-- Minimal Setup for File Upload/View System
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Create storage bucket for submission files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'submission-files', 
  'submission-files', 
  false, 
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/markdown',
    'video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv',
    'audio/mpeg', 'audio/wav', 'audio/ogg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Storage bucket created successfully!' as status;
```

### Step 2: Create Storage Policies Manually

#### 2.1 Go to Storage Settings
1. **Click on "Storage"** in the left sidebar
2. **Click on "submission-files"** bucket
3. **Click on "Policies"** tab

#### 2.2 Create Policy 1: Workers Upload
1. **Click "New Policy"**
2. **Select "Create a policy from scratch"**
3. **Fill in the details**:
   - **Policy Name**: `Workers can upload submission files`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **Policy definition**:
   ```sql
   bucket_id = 'submission-files' 
   AND auth.uid()::text = (storage.foldername(name))[1]
   ```
4. **Click "Review"** then **"Save policy"**

#### 2.3 Create Policy 2: Workers View
1. **Click "New Policy"**
2. **Select "Create a policy from scratch"**
3. **Fill in the details**:
   - **Policy Name**: `Workers can view their own submission files`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `authenticated`
   - **Policy definition**:
   ```sql
   bucket_id = 'submission-files' 
   AND auth.uid()::text = (storage.foldername(name))[1]
   ```
4. **Click "Review"** then **"Save policy"**

#### 2.4 Create Policy 3: Employers View
1. **Click "New Policy"**
2. **Select "Create a policy from scratch"**
3. **Fill in the details**:
   - **Policy Name**: `Employers can view submission files for their tasks`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `authenticated`
   - **Policy definition**:
   ```sql
   bucket_id = 'submission-files' 
   AND EXISTS (
     SELECT 1 FROM public.task_submissions ts
     JOIN public.tasks t ON ts.task_id = t.id
     WHERE t.created_by = auth.uid() 
     AND ts.proof_files @> ARRAY[name]
   )
   ```
4. **Click "Review"** then **"Save policy"**

#### 2.5 Create Policy 4: Admins View
1. **Click "New Policy"**
2. **Select "Create a policy from scratch"**
3. **Fill in the details**:
   - **Policy Name**: `Admins can view all submission files`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `authenticated`
   - **Policy definition**:
   ```sql
   bucket_id = 'submission-files' 
   AND EXISTS (
     SELECT 1 FROM public.profiles p 
     WHERE p.user_id = auth.uid() AND p.role = 'admin'
   )
   ```
4. **Click "Review"** then **"Save policy"**

### Step 3: Add Database Columns (Optional)
If you want to add the new columns to your database, run this in SQL Editor:

```sql
-- Add new columns to task_submissions table
ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS employer_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS proof_type TEXT CHECK (proof_type IN ('text', 'file', 'both')) DEFAULT 'text';

ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS file_metadata JSONB;

-- Update existing records
UPDATE public.task_submissions 
SET employer_id = (
  SELECT t.created_by 
  FROM public.tasks t 
  WHERE t.id = task_submissions.task_id
)
WHERE employer_id IS NULL;

UPDATE public.task_submissions 
SET proof_type = CASE 
  WHEN proof_text IS NOT NULL AND proof_files IS NOT NULL AND array_length(proof_files, 1) > 0 THEN 'both'
  WHEN proof_files IS NOT NULL AND array_length(proof_files, 1) > 0 THEN 'file'
  ELSE 'text'
END;
```

## ✅ What This Achieves

- ✅ **Storage bucket created** without permission issues
- ✅ **File upload policies** set up manually
- ✅ **Secure access control** for workers and employers
- ✅ **Database schema** updated (optional)
- ✅ **No SQL permission errors**

## 🎯 Alternative: Use Supabase CLI

If you have Supabase CLI installed, you can also run:

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Link your project
supabase link --project-ref ajnqnvogdkjhymweaunr

# Push the migration
supabase db push
```

## 🚀 Test Your Setup

After completing the setup:

1. **Go to your app**
2. **Try uploading a file** - it should work!
3. **Check "View" button** for employers
4. **Verify file preview** in modal

## 🎉 Success!

Your file upload/view system is now ready without any permission issues! The manual setup ensures everything works with your current permissions level.
