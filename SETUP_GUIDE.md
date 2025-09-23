# Complete File Upload/View System Setup Guide

## 🚀 Supabase Dashboard Setup

### Step 1: Go to Supabase Dashboard
1. **Visit**: https://supabase.com/dashboard
2. **Select your project**: `ajnqnvogdkjhymweaunr`
3. **Go to SQL Editor** in the left sidebar

### Step 2: Run Complete Setup Script
Copy and paste this entire script into your Supabase SQL Editor:

```sql
-- Complete Setup for File Upload/View System
-- Run this in Supabase Dashboard > SQL Editor

BEGIN;

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

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create storage policies for file access
-- Workers can upload their own files
CREATE POLICY "Workers can upload submission files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'submission-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Workers can view their own files
CREATE POLICY "Workers can view their own submission files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'submission-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Employers can view submission files for their tasks
CREATE POLICY "Employers can view submission files for their tasks" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'submission-files' 
  AND EXISTS (
    SELECT 1 FROM public.task_submissions ts
    JOIN public.tasks t ON ts.task_id = t.id
    WHERE t.created_by = auth.uid() 
    AND ts.proof_files @> ARRAY[name]
  )
);

-- Admins can view all submission files
CREATE POLICY "Admins can view all submission files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'submission-files' 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- 4. Add employer_id column to task_submissions
ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS employer_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 5. Update existing records to set employer_id
UPDATE public.task_submissions 
SET employer_id = (
  SELECT t.created_by 
  FROM public.tasks t 
  WHERE t.id = task_submissions.task_id
)
WHERE employer_id IS NULL;

-- 6. Make employer_id NOT NULL after populating
ALTER TABLE public.task_submissions 
ALTER COLUMN employer_id SET NOT NULL;

-- 7. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_task_submissions_employer_id ON public.task_submissions(employer_id);

-- 8. Add proof_type column
ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS proof_type TEXT CHECK (proof_type IN ('text', 'file', 'both')) DEFAULT 'text';

-- 9. Update proof_type based on existing data
UPDATE public.task_submissions 
SET proof_type = CASE 
  WHEN proof_text IS NOT NULL AND proof_files IS NOT NULL AND array_length(proof_files, 1) > 0 THEN 'both'
  WHEN proof_files IS NOT NULL AND array_length(proof_files, 1) > 0 THEN 'file'
  ELSE 'text'
END;

-- 10. Add file metadata column
ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS file_metadata JSONB;

-- 11. Create function to automatically set employer_id
CREATE OR REPLACE FUNCTION public.set_submission_employer_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT t.created_by INTO NEW.employer_id
  FROM public.tasks t
  WHERE t.id = NEW.task_id;
  
  -- Set proof_type based on provided data
  NEW.proof_type = CASE 
    WHEN NEW.proof_text IS NOT NULL AND NEW.proof_files IS NOT NULL AND array_length(NEW.proof_files, 1) > 0 THEN 'both'
    WHEN NEW.proof_files IS NOT NULL AND array_length(NEW.proof_files, 1) > 0 THEN 'file'
    ELSE 'text'
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger to automatically set employer_id
DROP TRIGGER IF EXISTS set_submission_employer_id_trigger ON public.task_submissions;
CREATE TRIGGER set_submission_employer_id_trigger
  BEFORE INSERT ON public.task_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_submission_employer_id();

COMMIT;

-- Success message
SELECT 'File upload/view system setup completed successfully!' as status;
```

3. **Click "Run"** to execute the script

### Step 3: Verify Setup
1. **Go to Storage** in the left sidebar
2. **You should see** a bucket named `submission-files`
3. **Click on it** to verify it exists

## 📁 File Structure

```
submission-files/
├── worker-id-1/
│   ├── 1703123456789-screenshot.png
│   └── 1703123456790-document.pdf
└── worker-id-2/
    ├── 1703123456791-logo.svg
    └── 1703123456792-mockup.jpg
```

## 🔧 React Components Updated

### Files Modified:
1. **`src/pages/worker/TaskDetail.tsx`** - Enhanced file upload with multiple files
2. **`src/pages/employer/SubmissionsReview.tsx`** - Working "View" button
3. **`src/components/ui/submission-proof-modal.tsx`** - File viewing modal
4. **`src/lib/submission-utils.ts`** - Utility functions

### Key Features:
- ✅ **Multiple file upload** (up to 5 files)
- ✅ **File validation** (type and size)
- ✅ **Progress tracking**
- ✅ **File preview** in modal
- ✅ **Download functionality**
- ✅ **Secure access control**

## 🎯 How It Works

### For Workers:
1. **Select task** to submit
2. **Add text proof** (optional)
3. **Upload files** (images, PDFs, documents, videos, audio)
4. **Submit** - files are uploaded to Supabase Storage
5. **Files are stored** in `submission-files/worker-id/` folder

### For Employers:
1. **Go to "Review Submissions"** page
2. **Click "View"** button on any submission
3. **See text proof** and uploaded files
4. **Preview images** directly in modal
5. **Download files** or view in new tab
6. **Approve/Reject** submissions

## 🔒 Security Features

- **Private bucket** - files are not publicly accessible
- **Signed URLs** - temporary access links (1 hour expiry)
- **RLS policies** - workers can only access their own files
- **Employer access** - can only view files for their tasks
- **File validation** - type and size restrictions

## 📋 Supported File Types

- **Images**: jpg, jpeg, png, gif, webp, svg
- **Documents**: pdf, doc, docx, txt, md
- **Videos**: mp4, avi, mov, wmv
- **Audio**: mp3, wav, ogg

## 📏 File Limits

- **Maximum file size**: 10MB per file
- **Maximum files**: 5 per submission
- **URL expiry**: 1 hour for signed URLs

## 🚨 Troubleshooting

### If you get "Bucket not found" error:
1. **Check Storage** in Supabase Dashboard
2. **Verify bucket exists** named `submission-files`
3. **Run the setup script again** if bucket is missing

### If file upload fails:
1. **Check file size** (must be under 10MB)
2. **Check file type** (must be supported)
3. **Verify user authentication**
4. **Check browser console** for errors

### If "View" button doesn't work:
1. **Check file exists** in storage
2. **Verify RLS policies** are correct
3. **Check user permissions**

## ✅ Testing Checklist

- [ ] **Worker can upload files**
- [ ] **Worker can submit with text + files**
- [ ] **Employer can view submissions**
- [ ] **Employer can see uploaded files**
- [ ] **Employer can download files**
- [ ] **Employer can preview images**
- [ ] **File validation works**
- [ ] **Error handling works**

## 🎉 Success!

After completing this setup:
- ✅ Workers can upload PDFs, images, and other files
- ✅ Employers can view all uploaded files
- ✅ Secure file access with proper permissions
- ✅ Beautiful UI for file management
- ✅ Complete error handling and validation

Your file upload/view system is now fully functional! 🚀
